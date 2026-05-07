import { Router } from 'express';
import { db } from '../lib/db.js';

type WithMongoId = { _id: string; [key: string]: unknown };
function project<T extends WithMongoId>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest } as Omit<T, '_id'> & { id: string };
}

const router = Router();

router.get('/', async (req, res) => {
  const items = await db.collection('offmarketproperties').find();
  res.json(items.map(project));
});

router.post('/', async (req, res) => {
  const body = req.body as {
    streetAddress?: string;
    suburb?: string;
    priceGuide?: number;
    bedrooms?: number;
    bathrooms?: number;
    sourceAgentId?: string;
    notes?: string;
    status?: 'available' | 'under-offer' | 'sold';
    attachments?: string[];
    priceHistory?: { date: string; price: number; note: string }[];
  };

  if (!body || !body.streetAddress) {
    res.status(400).json({ error: 'streetAddress is required' });
    return;
  }

  const now = new Date().toISOString();
  const doc: Record<string, unknown> = {
    ...body,
    status: body.status ?? 'available',
    createdAt: now,
    updatedAt: now,
  };
  delete (doc as { id?: unknown }).id;

  const id = await db.collection('offmarketproperties').insertOne(doc);
  const created = await db.collection('offmarketproperties').findById(id);
  if (!created) {
    res.status(500).json({ error: 'failed to create' });
    return;
  }
  res.status(201).json(project(created));
});

router.put('/:id', async (req, res) => {
  const body = req.body as {
    streetAddress?: string;
    suburb?: string;
    priceGuide?: number;
    bedrooms?: number;
    bathrooms?: number;
    sourceAgentId?: string;
    notes?: string;
    status?: 'available' | 'under-offer' | 'sold';
    attachments?: string[];
    priceHistory?: { date: string; price: number; note: string }[];
  };

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    ...body,
    updatedAt: now,
  };
  delete (updateData as { id?: unknown }).id;

  const found = await db.collection('offmarketproperties').findById(req.params.id);
  if (!found) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  await db.collection('offmarketproperties').updateOne(req.params.id, updateData);
  const updated = await db.collection('offmarketproperties').findById(req.params.id);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(project(updated));
});

export default router;