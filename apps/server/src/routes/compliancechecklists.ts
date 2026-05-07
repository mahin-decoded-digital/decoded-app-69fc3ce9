import { Router } from 'express';
import { db } from '../lib/db.js';

type WithMongoId = { _id: string; [key: string]: unknown };
function project<T extends WithMongoId>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest } as Omit<T, '_id'> & { id: string };
}

const router = Router();

interface CompliancechecklistBody {
  dealId?: string;
  items?: { label: string; completed: boolean; completedAt: Date | null; completedBy: string }[];
  stage?: 'engagement' | 'search' | 'offer' | 'settlement';
}

// list
router.get('/', async (req, res) => {
  const items = await db.collection('compliancechecklists').find();
  res.json(items.map(project));
});

// create
router.post('/', async (req, res) => {
  const body = req.body as CompliancechecklistBody;
  if (!body || !body.dealId) {
    res.status(400).json({ error: 'dealId is required' });
    return;
  }
  const now = new Date().toISOString();
  const doc: Record<string, unknown> = {
    ...body,
    createdAt: now,
    updatedAt: now,
  };
  delete (doc as { id?: unknown }).id;
  const id = await db.collection('compliancechecklists').insertOne(doc);
  const created = await db.collection('compliancechecklists').findById(id);
  if (!created) {
    res.status(500).json({ error: 'failed to create' });
    return;
  }
  res.status(201).json(project(created));
});

// update
router.put('/:id', async (req, res) => {
  const body = req.body as CompliancechecklistBody;
  const now = new Date().toISOString();
  const updated_fields: Record<string, unknown> = {
    ...body,
    updatedAt: now,
  };
  delete (updated_fields as { id?: unknown }).id;
  const found = await db.collection('compliancechecklists').findById(req.params.id);
  if (!found) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  await db.collection('compliancechecklists').updateOne(req.params.id, updated_fields);
  const updated = await db.collection('compliancechecklists').findById(req.params.id);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(project(updated));
});

export default router;
