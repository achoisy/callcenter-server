import express from 'express';
import { mongooseQueryParser } from '../middlewares/';
import { ClientError, CustomError } from '../errors';
import { Client } from '../models/client';

const router = express.Router();

router.post('/', async (req, res) => {
  const { phone, name, company, email, address } = req.body;

  try {
    // Check if Client already exist in database
    const existingClient = await Client.findOne({ phone });
    if (existingClient) {
      throw new ClientError();
    }
    // Add new client
    const client = Client.build({
      phone,
      name,
      company,
      email,
      address,
    });
    await client.save();

    res.send(client);
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new Error(error);
  }
});

router.get('/', mongooseQueryParser, async (req, res) => {
  try {
    const client = await Client.query(req.mongoQuery!);
    res.status(200).send(client);
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new Error(error);
  }
});

router.put('/:clientId', async (req, res) => {
  const { phone, name, company, email, address } = req.body;

  try {
    // Check if Client already exist in database
    const client = await Client.findOne({ phone });
    if (!client) {
      throw new ClientError();
    }
    // Update client
    await client.updateOne({ phone, name, company, email, address });

    res.status(200).send(client);
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new Error(error);
  }
});

export { router as clientRouter };
