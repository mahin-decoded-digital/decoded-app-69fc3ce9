import { Router } from 'express';
import { db } from '../lib/db.js';

type WithMongoId = { _id: string; [key: string]: unknown };
function project<T extends WithMongoId>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest } as Omit<T, '_id'> & { id: string };
}

interface Deal {
  clientId: string;
  agentId?: string;
  title: string;
  status?: 'lead' | 'active' | 'due-diligence' | 'offer' | 'won' | 'lost';
  suburb?: string;
  budgetMin?: number;
  budgetMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  brief?: string;
  geoSegment?: 'East' | 'West' | 'North' | 'Central';
  aiConsentGiven?: boolean;
  agreementStatus?: 'pending' | 'sent' | 'signed' | 'none';
  invoiceStatus?: 'none' | 'deposit-sent' | 'deposit-paid' | 'final-sent' | 'final-paid';
}

const router = Router();

router.get('/', async (req, res) => {
  const items = await db.collection('deals').find();
  res.json(items.map(project));
});

router.post('/', async (req, res) => {
  const body = req.body as Partial<Deal>;
  if (!body || !body.title || !body.clientId) {
    res.status(400).json({ error: 'title and clientId are required' });
    return;
  }
  const now = new Date().toISOString();
  const doc: Record<string, unknown> = {
    ...body,
    status: body.status ?? 'lead',
    createdAt: now,
    updatedAt: now,
  };
  delete (doc as { id?: unknown }).id;
  const id = await db.collection('deals').insertOne(doc);
  const created = await db.collection('deals').findById(id);
  if (!created) {
    res.status(500).json({ error: 'failed to create' });
    return;
  }
  res.status(201).json(project(created));
});

router.put('/:id', async (req, res) => {
  const body = req.body as Partial<Deal>;
  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    ...body,
    updatedAt: now,
  };
  delete (update as { id?: unknown }).id;
  const found = await db.collection('deals').findById(req.params.id);
  if (!found) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  await db.collection('deals').updateOne(req.params.id, update);
  const updated = await db.collection('deals').findById(req.params.id);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(project(updated));
});

router.delete('/:id', async (req, res) => {
  const found = await db.collection('deals').findById(req.params.id);
  if (!found) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  await db.collection('deals').deleteOne(req.params.id);
  res.json({ success: true });
});

export default router;
