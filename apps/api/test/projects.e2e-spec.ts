import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { DatabaseService } from '../src/database/database.service.js';
import { entityIdSchema } from '@ba/contracts';
import pg from 'pg';

describe('Workspace and Project persistence', () => {
  let db: PGlite;
  let server: PGLiteSocketServer;
  let app: INestApplication<App>;
  let postgres: pg.Client | undefined;
  const testSchema = `test_${randomUUID().replaceAll('-', '')}`;
  const token = randomBytes(32).toString('hex');
  const userId = randomUUID();
  const otherId = randomUUID();
  let foreignWorkspace: string;
  let foreignProject: string;
  let workspaceId: string;
  let projectId: string;

  async function boot(): Promise<INestApplication<App>> {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const application = module.createNestApplication<INestApplication<App>>();
    configureApp(application);
    await application.init();
    return application;
  }

  beforeAll(async () => {
    const migration = await readFile(
      new URL(
        '../prisma/migrations/202609120001_workspace_project/migration.sql',
        import.meta.url,
      ),
      'utf8',
    );
    if (process.env.TEST_DATABASE_URL) {
      const url = new URL(process.env.TEST_DATABASE_URL);
      if (
        !['127.0.0.1', 'localhost'].includes(url.hostname) ||
        url.pathname !== '/ba_agent_test'
      )
        throw new Error('Tests require local ba_agent_test database');
      postgres = new pg.Client({ connectionString: url.toString() });
      await postgres.connect();
      await postgres.query(`CREATE SCHEMA "${testSchema}"`);
      await postgres.query(`SET search_path TO "${testSchema}"`);
      await postgres.query(migration);
      url.searchParams.set('schema', testSchema);
      vi.stubEnv('DATABASE_URL', url.toString());
    } else {
      db = await PGlite.create();
      await db.exec(migration);
      server = new PGLiteSocketServer({
        db,
        host: '127.0.0.1',
        port: 0,
        maxConnections: 10,
      });
      await server.start();
      vi.stubEnv(
        'DATABASE_URL',
        `postgresql://postgres@${server.getServerConn()}/postgres`,
      );
    }
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DEV_AUTH_ENABLED', 'true');
    vi.stubEnv('DEV_AUTH_TOKEN', token);
    vi.stubEnv('DEV_USER_ID', userId);
    app = await boot();
    const prisma = app.get(DatabaseService).db;
    await prisma.user.createMany({
      data: [
        { id: userId, displayName: 'Test BA' },
        { id: otherId, displayName: 'Other BA' },
      ],
    });
    const foreign = await prisma.workspace.create({
      data: {
        name: 'Other workspace',
        members: { create: { userId: otherId } },
      },
    });
    foreignWorkspace = foreign.id;
    foreignProject = (
      await prisma.project.create({
        data: {
          name: 'Private project',
          workspaceId: foreign.id,
          members: { create: { userId: otherId } },
        },
      })
    ).id;
  }, 60000);

  afterAll(async () => {
    await app?.close();
    await server?.stop();
    await db?.close();
    if (postgres) {
      await postgres.query(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE`);
      await postgres.end();
    }
    vi.unstubAllEnvs();
  });

  const api = () => request(app.getHttpServer());
  const auth = () => `Bearer ${token}`;

  it('rejects missing/wrong credentials and spoofed identity headers', async () => {
    await api().get('/api/v1/workspaces').set('x-user-id', userId).expect(401);
    await api()
      .get('/api/v1/workspaces')
      .set('Authorization', 'Bearer invalid')
      .expect(401);
  });

  it('rejects invalid input and caller-controlled ownership', async () => {
    await api()
      .post('/api/v1/workspaces')
      .set('Authorization', auth())
      .send({ name: '   ' })
      .expect(400);
    await api()
      .post('/api/v1/workspaces')
      .set('Authorization', auth())
      .send({ name: 'Valid', userId: otherId })
      .expect(400);
    await api()
      .get('/api/v1/workspaces/not-a-uuid/projects')
      .set('Authorization', auth())
      .expect(400);
  });

  it('creates workspace membership and a private project with trimmed fields', async () => {
    const workspace = await api()
      .post('/api/v1/workspaces')
      .set('Authorization', auth())
      .send({ name: '  BA workspace  ' })
      .expect(201);
    workspaceId = entityIdSchema.parse(workspace.body.id);
    expect(workspace.body.name).toBe('BA workspace');
    const project = await api()
      .post(`/api/v1/workspaces/${workspaceId}/projects`)
      .set('Authorization', auth())
      .send({ name: '  MVP  ', businessGoal: 'Capture evidence' })
      .expect(201);
    projectId = entityIdSchema.parse(project.body.id);
    expect(project.body).toMatchObject({
      workspaceId,
      name: 'MVP',
      version: 1,
      businessGoal: 'Capture evidence',
    });
    expect(
      await app
        .get(DatabaseService)
        .db.projectMember.count({ where: { projectId, userId } }),
    ).toBe(1);
  });

  it('lists only accessible workspaces/projects and denies other tenants', async () => {
    const workspaces = await api()
      .get('/api/v1/workspaces')
      .set('Authorization', auth())
      .expect(200);
    expect(workspaces.body).toHaveLength(1);
    const projects = await api()
      .get(`/api/v1/workspaces/${workspaceId}/projects`)
      .set('Authorization', auth())
      .expect(200);
    expect(projects.body).toHaveLength(1);
    const foreignPath = `/api/v1/workspaces/${foreignWorkspace}/projects`;
    await api().get(foreignPath).set('Authorization', auth()).expect(404);
    await api()
      .get(`${foreignPath}/${foreignProject}`)
      .set('Authorization', auth())
      .expect(404);
    await api()
      .post(foreignPath)
      .set('Authorization', auth())
      .send({ name: 'Injected' })
      .expect(404);
    await api()
      .patch(`${foreignPath}/${foreignProject}`)
      .set('Authorization', auth())
      .send({ name: 'Injected', expectedVersion: 1 })
      .expect(404);
    await api()
      .get(`/api/v1/workspaces/${workspaceId}/projects/${foreignProject}`)
      .set('Authorization', auth())
      .expect(404);
  });

  it('workspace membership alone does not grant access to another private project', async () => {
    const prisma = app.get(DatabaseService).db;
    await prisma.workspaceMember.create({
      data: { workspaceId, userId: otherId },
    });
    const privateProject = await prisma.project.create({
      data: {
        name: 'Peer private project',
        workspaceId,
        members: { create: { userId: otherId } },
      },
    });
    await api()
      .get(`/api/v1/workspaces/${workspaceId}/projects/${privateProject.id}`)
      .set('Authorization', auth())
      .expect(404);
    await api()
      .patch(`/api/v1/workspaces/${workspaceId}/projects/${privateProject.id}`)
      .set('Authorization', auth())
      .send({ name: 'No', expectedVersion: 1 })
      .expect(404);
    const result = await api()
      .get(`/api/v1/workspaces/${workspaceId}/projects`)
      .set('Authorization', auth())
      .expect(200);
    expect(result.body).toHaveLength(1);
  });

  it('updates atomically and rejects stale versions and empty/unknown updates', async () => {
    const path = `/api/v1/workspaces/${workspaceId}/projects/${projectId}`;
    const result = await api()
      .patch(path)
      .set('Authorization', auth())
      .send({ name: 'Updated', expectedVersion: 1 })
      .expect(200);
    expect(result.body).toMatchObject({ name: 'Updated', version: 2 });
    await api()
      .patch(path)
      .set('Authorization', auth())
      .send({ name: 'Stale', expectedVersion: 1 })
      .expect(409);
    await api()
      .patch(path)
      .set('Authorization', auth())
      .send({ expectedVersion: 2 })
      .expect(400);
    await api()
      .patch(path)
      .set('Authorization', auth())
      .send({ workspaceId: foreignWorkspace, expectedVersion: 2 })
      .expect(400);
    const latest = await api()
      .get(path)
      .set('Authorization', auth())
      .expect(200);
    expect(latest.body.name).toBe('Updated');
  });

  it('retains data after API shutdown and reconnect', async () => {
    await app.close();
    app = await boot();
    const result = await api()
      .get(`/api/v1/workspaces/${workspaceId}/projects/${projectId}`)
      .set('Authorization', auth())
      .expect(200);
    expect(result.body).toMatchObject({ name: 'Updated', version: 2 });
  });

  it('allows exactly one competing update for the same version', async () => {
    const path = `/api/v1/workspaces/${workspaceId}/projects/${projectId}`;
    const results = await Promise.all([
      api()
        .patch(path)
        .set('Authorization', auth())
        .send({ name: 'First writer', expectedVersion: 2 }),
      api()
        .patch(path)
        .set('Authorization', auth())
        .send({ name: 'Second writer', expectedVersion: 2 }),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([200, 409]);
    const latest = await api()
      .get(path)
      .set('Authorization', auth())
      .expect(200);
    expect(latest.body.version).toBe(3);
  });

  it('enforces workspace consistency at the database foreign-key boundary', async () => {
    await expect(
      app
        .get(DatabaseService)
        .db.projectMember.create({
          data: { workspaceId: foreignWorkspace, projectId, userId: otherId },
        }),
    ).rejects.toThrow();
  });

  it('disables development authentication in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const production = await boot();
    try {
      await request(production.getHttpServer())
        .get('/api/v1/workspaces')
        .set('Authorization', auth())
        .expect(401);
    } finally {
      await production.close();
      vi.stubEnv('NODE_ENV', 'development');
    }
  });
});
