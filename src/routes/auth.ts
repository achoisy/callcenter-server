import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { BadRequestError } from '../errors/';
import { validateRequest, requireAdmin } from '../middlewares/';
import { JWT } from '../services/jwt-helper';
import { User } from '../models/user';
import { Password } from '../services/password';

const router = express.Router();

router.get('/users/currentuser', (req, res) => {
  res.send({ currentUser: req.currentUser || null });
});

router.post('/users/signout', (req, res) => {
  req.session = null;

  res.send({});
});

router.post(
  '/users/signin',
  [
    // express-validator query middleware
    body('email').isEmail().normalizeEmail().withMessage('Email must be valid'),
    body('password').trim().notEmpty().withMessage('You must apply a password'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const passwordMatch = await Password.compare(
      existingUser.password,
      password
    );

    if (!passwordMatch) {
      throw new BadRequestError('Invalid credentials');
    }

    req.session = {
      jwt: JWT.sign({
        id: existingUser.id,
        email: existingUser.email,
        admin: existingUser.admin || false,
      }),
    };

    res.status(200).send(existingUser);
  }
);

router.post(
  '/users/signup',
  requireAdmin,
  [
    body('email').isEmail().withMessage('Email est requis'),
    body('password')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('Mot de passe doit etre entre 4 et 20 caracteres'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new BadRequestError('Email in use');
    }

    const user = User.build({ email, password });
    await user.save();

    // Store jwt token in cookie
    /* req.session = {
      jwt: JWT.sign({
        id: user.id,
        email: user.email,
      }),
    }; */

    res.status(201).send(user);
  }
);

export { router as authRouter };
