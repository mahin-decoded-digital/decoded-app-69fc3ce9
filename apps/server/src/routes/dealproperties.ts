import { Router } from 'express';
import { db } from '../lib/db.js';

type WithMongoId = { _id: string; [key: string]: unknown };
function project<T extends WithMongoId>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest } as Omit<T, '_id'> & { id: string };
}

const router = Router();

interface DealpropertyBody {
  dealId?: string;
  propertyId?: string;
  shortlistStatus?: 'considering' | 'shortlisted' | 'rejected' | 'offer-made';
  clientVisible?: boolean;
  internalNotes?: string;
  clientNotes?: string;
  ddRecordId?: string | null;
}

router.post('/', async (req, res) => {
  const body = req.body as DealpropertyBody;
  if (!body || !body.dealId || !body.propertyId) {
    res.status(400).json({ error: 'dealId and propertyId are required' });
    return;
  }
  const now = new Date().toISOString();
  const doc: Record<string, unknown> = {
    ...body,
    createdAt: now,
    updatedAt: now,
  };
  delete (doc as { id?: unknown }).id;
  const id = await db.collection('dealproperties').insertOne(doc);
  const created = await db.collection('dealproperties').findById(id);
  if (!created) {
    res.status(500).json({ error: 'failed to create' });
    return;
  }
  res.status(201).json(project(created));
});

router.put('/:id', async (req, res) => {
  const body = req.body as DealpropertyBody;
  const updatedAt = new Date().toISOString();
  const updated_fields: Record<string, unknown> = {
    ...body,
    updatedAt,
  };
  delete (updated_fields as { id?: unknown }).id;
  const found = await db.collection('dealproperties').findById(req.params.id);
  if (!found) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  await db.collection('dealproperties').updateOne(req.params.id, updated_fields);
  const updated = await db.collection('dealproperties').findById(req.params.id);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(project(updated));
});

export default router;
