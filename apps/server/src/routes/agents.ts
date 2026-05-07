import { Router } from 'express';
import { db } from '../lib/db.js';

type WithMongoId = { _id: string; [key: string]: unknown };
function project<T extends WithMongoId>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest } as Omit<T, '_id'> & { id: string };
}

const router = Router();

router.get('/', async (req, res) => {
  const items = await db.collection('agents').find();
  res.json(items.map(project));
});

router.post('/', async (req, res) => {
  const body = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    agency?: string;
    geoSegment?: 'East' | 'West' | 'North' | 'Central';
    isPreferred?: boolean;
    suburb?: string;
    lastContactedAt?: Date | null;
    notes?: string;
  };
  if (!body || !body.name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  if (!body.email) {
    res.status(400).json({ error: 'email is required' });
    return;
  }
  const now = new Date().toISOString();
  const doc: Record<string, unknown> = {
    ...body,
    createdAt: now,
    updatedAt: now,
  };
  delete (doc as { id?: unknown }).id;
  const id = await db.collection('agents').insertOne(doc);
  const created = await db.collection('agents').findById(id);
  if (!created) {
    res.status(500).json({ error: 'failed to create' });
    return;
  }
  res.status(201).json(project(created));
});

router.put('/:id', async (req, res) => {
  const body = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    agency?: string;
    geoSegment?: 'East' | 'West' | 'North' | 'Central';
    isPreferred?: boolean;
    suburb?: string;
    lastContactedAt?: Date | null;
    notes?: string;
  };
  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    ...body,
    updatedAt: now,
  };
  delete (updateData as { id?: unknown }).id;
  const found = await db.collection('agents').updateOne(req.params.id, updateData);
  if (!found) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const updated = await db.collection('agents').findById(req.params.id);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(project(updated));
});

router.delete('/:id', async (req, res) => {
  const deleted = await db.collection('agents').deleteOne(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
