import express from 'express';
import { mongooseQueryParser } from '../middlewares/';
import { ClientError, CustomError, DatabaseConnectionError } from '../errors';
import { Client } from '../models/client';

const router = express.Router();

router.post('/', async (req, res) => {
  const {
    phone = '',
    name = '',
    company = '',
    email = '',
    address = '',
  } = req.body;

  try {
    // Check if Client already exist in database
    const existingClient = await Client.findOne({ phone });
    if (existingClient) {
      throw new ClientError();
    }
    // Add new client
    const client = new Client({
      phone,
      name,
      company,
      email,
      address,
    });
    await client.save();

    res.status(201).send(client);
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseConnectionError('Could not create new client');
  }
});

router.get('/', mongooseQueryParser, async (req, res) => {
  try {
    const clients = await Client.query(req.mongoQuery!);
    res.status(200).send(clients);
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseConnectionError('Could not query client');
  }
});

router.put('/:clientId', async (req, res) => {
  const { phone, name, company, email, address } = req.body;
  const clientId = req.params.clientId;

  try {
    // Check if Client already exist in database
    const client = await Client.findById(clientId);

    if (!client) {
      throw new ClientError();
    }
    // Update client
    const updateClient = await client.updateOne({
      phone,
      name,
      company,
      email,
      address,
    });

    res.status(200).send(updateClient);
  } catch (error) {
    console.error(error);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new DatabaseConnectionError('Could not update client');
  }
});

export { router as clientRouter };
