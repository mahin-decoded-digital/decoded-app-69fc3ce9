import { Router } from 'express';
import { db } from '../lib/db.js';

type WithMongoId = { _id: string; [key: string]: unknown };
function project<T extends WithMongoId>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest } as Omit<T, '_id'> & { id: string };
}

const router = Router();

interface DuediligencerecordBody {
  dealPropertyId?: string;
  floodMapUrl?: string;
  naturalHazardsUrl?: string;
  floodMapScreenshot?: string;
  hazardScreenshot?: string;
  comparableSales?: { address: string; salePrice: number; saleDate: string; bedrooms: number; bathrooms: number; notes: string }[];
  checklistItems?: { item: string; completed: boolean; completedAt: Date | null }[];
  summaryNotes?: string;
  reportGeneratedAt?: Date | null;
}

// LIST
router.get('/', async (req, res) => {
  const items = await db.collection('duediligencerecords').find();
  res.json(items.map(project));
});

// CREATE
router.post('/', async (req, res) => {
  const body = req.body as DuediligencerecordBody;
  if (!body || !body.dealPropertyId) {
    res.status(400).json({ error: 'dealPropertyId is required' });
    return;
  }
  const now = new Date().toISOString();
  const doc: Record<string, unknown> = {
    ...body,
    createdAt: now,
    updatedAt: now,
  };
  delete (doc as { id?: unknown }).id;
  const id = await db.collection('duediligencerecords').insertOne(doc);
  const created = await db.collection('duediligencerecords').findById(id);
  if (!created) {
    res.status(500).json({ error: 'failed to create' });
    return;
  }
  res.status(201).json(project(created));
});

// UPDATE
router.put('/:id', async (req, res) => {
  const body = req.body as DuediligencerecordBody;
  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    ...body,
    updatedAt: now,
  };
  delete (updateData as { id?: unknown }).id;
  const found = await db.collection('duediligencerecords').findById(req.params.id);
  if (!found) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  await db.collection('duediligencerecords').updateOne(req.params.id, updateData);
  const updated = await db.collection('duediligencerecords').findById(req.params.id);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(project(updated));
});

export default router;