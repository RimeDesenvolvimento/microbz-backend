import { Express, Router } from 'express';
import { readdirSync } from 'fs';
import { join } from 'path';

export default (app: Express) => {
  const router = Router();
  app.use('/api', router);

  const modulesPath = join(__dirname, '../modules');

  const loadRoutes = (dir: string) => {
    readdirSync(dir, { withFileTypes: true }).forEach(async file => {
      const fullPath = join(dir, file.name);

      if (file.isDirectory()) {
        loadRoutes(fullPath);
      } else if (file.name.endsWith('routes.ts')) {
        (await import(fullPath)).default(router);
      }
    });
  };

  loadRoutes(modulesPath);
};
