import { Router } from 'express';
import { db } from '../lib/db.js';

type WithMongoId = { _id: string; [key: string]: unknown };
function project<T extends WithMongoId>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest } as Omit<T, '_id'> & { id: string };
}

const router = Router();

router.get('/', async (req, res) => {
  const items = await db.collection('meetingnotes').find();
  res.json(items.map(project));
});

router.post('/', async (req, res) => {
  const body = req.body as {
    dealId?: string;
    title?: string;
    rawTranscript?: string;
    aiSummary?: string;
    actionItems?: { task: string; assignee: string; dueDate: string; completed: boolean }[];
    consentConfirmed?: boolean;
    visibility?: 'internal' | 'client-visible';
  };

  if (!body || !body.dealId || !body.title) {
    res.status(400).json({ error: 'dealId and title are required' });
    return;
  }

  const now = new Date().toISOString();
  const doc: Record<string, unknown> = {
    ...body,
    createdAt: now,
    updatedAt: now,
  };
  delete (doc as { id?: unknown }).id;

  const id = await db.collection('meetingnotes').insertOne(doc);
  const created = await db.collection('meetingnotes').findById(id);
  if (!created) {
    res.status(500).json({ error: 'failed to create' });
    return;
  }
  res.status(201).json(project(created));
});

router.put('/:id', async (req, res) => {
  const body = req.body as {
    dealId?: string;
    title?: string;
    rawTranscript?: string;
    aiSummary?: string;
    actionItems?: { task: string; assignee: string; dueDate: string; completed: boolean }[];
    consentConfirmed?: boolean;
    visibility?: 'internal' | 'client-visible';
  };

  const now = new Date().toISOString();
  const updated_fields: Record<string, unknown> = {
    ...body,
    updatedAt: now,
  };
  delete (updated_fields as { id?: unknown }).id;

  const found = await db.collection('meetingnotes').updateOne(req.params.id, updated_fields);
  if (!found) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const updated = await db.collection('meetingnotes').findById(req.params.id);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(project(updated));
});

router.delete('/:id', async (req, res) => {
  const found = await db.collection('meetingnotes').deleteOne(req.params.id);
  if (!found) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
