import { Router } from 'express';
import { db } from '../lib/db.js';

type WithMongoId = { _id: string; [key: string]: unknown };
function project<T extends WithMongoId>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest } as Omit<T, '_id'> & { id: string };
}

interface Requirementblast {
  dealId: string;
  geoSegment?: 'East' | 'West' | 'North' | 'Central' | 'All';
  preferredOnly?: boolean;
  agentIds?: string[];
  subject?: string;
  body?: string;
  sentAt?: Date | null;
  status?: 'draft' | 'sent';
  recipientCount?: number;
}

const router = Router();

router.post('/', async (req, res) => {
  const body = req.body as Partial<Requirementblast>;
  if (!body || !body.dealId) {
    res.status(400).json({ error: 'dealId is required' });
    return;
  }
  const now = new Date().toISOString();
  const doc: Record<string, unknown> = {
    ...body,
    status: body.status ?? 'draft',
    createdAt: now,
    updatedAt: now,
  };
  delete (doc as { id?: unknown }).id;
  const id = await db.collection('requirementblasts').insertOne(doc);
  const created = await db.collection('requirementblasts').findById(id);
  if (!created) {
    res.status(500).json({ error: 'failed to create' });
    return;
  }
  res.status(201).json(project(created));
});

router.put('/:id', async (req, res) => {
  const body = req.body as Partial<Requirementblast>;
  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    ...body,
    updatedAt: now,
  };
  delete (updateData as { id?: unknown }).id;
  const found = await db.collection('requirementblasts').findById(req.params.id);
  if (!found) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  await db.collection('requirementblasts').updateOne(req.params.id, updateData);
  const updated = await db.collection('requirementblasts').findById(req.params.id);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(project(updated));
});

export default router;
