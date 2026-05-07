import { useMemo, useState, useEffect } from 'react'
import { MoreHorizontal, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useEmailStore } from '@/stores/useEmailStore';
import type { EmailTemplate } from '@/types';

const CATEGORIES: Array<{ value: EmailTemplate['category'] | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'requirement-blast', label: 'Requirement Blast' },
  { value: 'dd-request', label: 'DD Request' },
  { value: 'status-update', label: 'Status Update' },
  { value: 'post-settlement', label: 'Post-Settlement' },
  { value: 'referrer-thanks', label: 'Referrer Thanks' },
  { value: 'other', label: 'Other' },
];

export default function EmailTemplatesPage() {
  // === auto fetch-on-mount (backend planner) ===
  const fetchEmailtemplates = useEmailStore((s) => s.fetchEmailtemplates);
  useEffect(() => {
    fetchEmailtemplates();
  }, [fetchEmailtemplates]);
  // === end auto fetch-on-mount ===

  const templates = useEmailStore((s) => s.templates);
  const addTemplate = useEmailStore((s) => s.addTemplate);
  const updateTemplate = useEmailStore((s) => s.updateTemplate);
  const deleteTemplate = useEmailStore((s) => s.deleteTemplate);

  const [categoryTab, setCategoryTab] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Form
  const [tName, setTName] = useState('');
  const [tCategory, setTCategory] = useState<EmailTemplate['category']>('welcome');
  const [tSubject, setTSubject] = useState('');
  const [tBody, setTBody] = useState('');
  const [tActive, setTActive] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    if (categoryTab === 'all') return templates;
    return templates.filter((t) => t.category === categoryTab);
  }, [templates, categoryTab]);

  function resetForm() {
    setTName(''); setTCategory('welcome'); setTSubject(''); setTBody(''); setTActive(true); setFormErrors({});
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!tName.trim()) errs.name = 'Name is required.';
    if (!tSubject.trim()) errs.subject = 'Subject is required.';
    if (!tBody.trim()) errs.body = 'Body is required.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleAdd() {
    if (!validate()) return;
    addTemplate({ name: tName.trim(), category: tCategory, subject: tSubject.trim(), body: tBody.trim(), isActive: tActive });
    toast.success('Template saved.');
    resetForm();
    setAddOpen(false);
  }

  function handleEditOpen(t: EmailTemplate) {
    setEditTemplate(t);
    setTName(t.name); setTCategory(t.category); setTSubject(t.subject);
    setTBody(t.body); setTActive(t.isActive);
    setOpenMenuId(null);
  }

  function handleEditSave() {
    if (!editTemplate || !validate()) return;
    updateTemplate(editTemplate.id, {
      name: tName.trim(), category: tCategory, subject: tSubject.trim(),
      body: tBody.trim(), isActive: tActive,
    });
    toast.success('Template updated.');
    setEditTemplate(null);
    resetForm();
  }

  function handleDelete(id: string) {
    deleteTemplate(id);
    setDeleteId(null);
    toast.success('Template deleted.');
  }

  const templateForm = (
    <Dialog open={addOpen || !!editTemplate} onOpenChange={(v) => { if (!v) { setAddOpen(false); setEditTemplate(null); resetForm(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTemplate ? 'Edit Template' : 'New Email Template'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Template name</Label>
              <Input value={tName} onChange={(e) => setTName(e.target.value)} placeholder="Welcome — New Engagement" />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={tCategory} onChange={(e) => setTCategory(e.target.value as EmailTemplate['category'])}>
                <option value="welcome">Welcome</option>
                <option value="requirement-blast">Requirement Blast</option>
                <option value="dd-request">DD Request</option>
                <option value="status-update">Status Update</option>
                <option value="post-settlement">Post-Settlement</option>
                <option value="referrer-thanks">Referrer Thanks</option>
                <option value="other">Other</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={tSubject} onChange={(e) => setTSubject(e.target.value)} placeholder="Welcome to Martelli Buyers — Your Search Begins" />
            {formErrors.subject && <p className="text-xs text-destructive">{formErrors.subject}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Body</Label>
            <Textarea value={tBody} onChange={(e) => setTBody(e.target.value)} rows={8} placeholder="Write your email template here…" />
            {formErrors.body && <p className="text-xs text-destructive">{formErrors.body}</p>}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={tActive} onCheckedChange={setTActive} />
            <span className="text-sm text-foreground">Active</span>
          </label>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={editTemplate ? handleEditSave : handleAdd}>Save template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Email Templates</h1>
            <p className="text-sm text-muted-foreground mt-0.5">A library of 20–30 reusable templates across the engagement lifecycle.</p>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>+ New template</Button>
        </div>

        <Tabs defaultValue="all" value={categoryTab} onValueChange={setCategoryTab}>
          <TabsList className="flex-wrap gap-1">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.value} value={c.value}>{c.label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={categoryTab}>
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Mail size={22} />}
                heading="No email templates saved yet."
                description="Build your library of welcome emails, requirement blasts, and post-settlement messages to save time on every engagement."
                ctaLabel="+ Create first template"
                onCta={() => setAddOpen(true)}
              />
            ) : (
              <div className="space-y-2">
                {filtered.map((t) => (
                  <div key={t.id} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <Badge variant="secondary" className="text-xs capitalize">{t.category.replace('-', ' ')}</Badge>
                        {!t.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{t.subject}</p>
                    </div>
                    <div className="relative shrink-0">
                      <button
                        className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-[var(--surface-tinted)]"
                        onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {openMenuId === t.id && (
                        <div className="absolute right-0 top-full mt-1 z-10 w-36 rounded-md border border-border bg-card shadow-[var(--shadow-elevated)]">
                          <button className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-tinted)]" onClick={() => handleEditOpen(t)}>Edit</button>
                          <button className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/5" onClick={() => { setDeleteId(t.id); setOpenMenuId(null); }}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {templateForm}

      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete template</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Are you sure you want to permanently delete this template?</p>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Yes, delete permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}