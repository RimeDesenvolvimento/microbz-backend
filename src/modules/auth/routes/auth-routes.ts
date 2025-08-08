import { Router } from 'express';
import { SignUpSchema } from '../validations/sign-up/signup-schemas';
import { validate } from '../../../common/middlewares/validation-middleware';
import { makeAuthController } from '../../../common/factories/controllers/auth-controller-factory';
import { LoginSchema } from '../validations/login/login-schemas';

const authController = makeAuthController();

export default (router: Router): void => {
  router.post('/auth/signup', validate(SignUpSchema), (req, res, next) =>
    authController.signUp(req, res, next)
  );
  router.post('/auth/login', validate(LoginSchema), (req, res, next) =>
    authController.login(req, res, next)
  );
};
