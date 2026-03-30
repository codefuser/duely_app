import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, X, Check } from 'lucide-react';
import type { UserTab } from '@/lib/tabs';

interface Props {
  tabs: UserTab[];
  onAdd: (name: string) => boolean;
  onEdit: (id: string, name: string) => boolean;
  onDelete: (id: string) => void;
  onReorder: (ids: string[]) => void;
  onBack: () => void;
}

const TabManager = ({ tabs, onAdd, onEdit, onDelete, onReorder, onBack }: Props) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [items, setItems] = useState(tabs.map(t => t.id));

  const handleAdd = () => {
    if (!newName.trim()) return;
    if (!onAdd(newName.trim())) {
      setError('Tab name already exists');
      return;
    }
    setNewName('');
    setError('');
  };

  const handleEdit = (id: string) => {
    if (!editName.trim()) return;
    if (!onEdit(id, editName.trim())) {
      setError('Tab name already exists');
      return;
    }
    setEditingId(null);
    setError('');
  };

  const handleReorder = (newOrder: string[]) => {
    // Keep 'all' always first
    if (newOrder[0] !== 'all') {
      const allIdx = newOrder.indexOf('all');
      newOrder.splice(allIdx, 1);
      newOrder.unshift('all');
    }
    setItems(newOrder);
    onReorder(newOrder);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-40 bg-background flex flex-col"
    >
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold">Manage Tabs</h2>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex gap-2 mb-4">
          <input
            value={newName}
            onChange={e => { setNewName(e.target.value); setError(''); }}
            placeholder="New tab name"
            className="flex-1 px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>

        {error && <p className="text-xs text-credit mb-3">{error}</p>}

        <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2">
          {items.map(id => {
            const tab = tabs.find(t => t.id === id);
            if (!tab) return null;
            return (
              <Reorder.Item
                key={id}
                value={id}
                className="bg-card rounded-xl border border-border p-3 flex items-center gap-3"
                style={{ cursor: id === 'all' ? 'default' : 'grab' }}
                dragListener={id !== 'all'}
              >
                <GripVertical className={`w-4 h-4 shrink-0 ${id === 'all' ? 'text-transparent' : 'text-muted-foreground'}`} />
                {editingId === id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      value={editName}
                      onChange={e => { setEditName(e.target.value); setError(''); }}
                      className="flex-1 px-2 py-1 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleEdit(id)}
                    />
                    <button onClick={() => handleEdit(id)} className="p-1.5 rounded-lg hover:bg-accent text-payment">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{tab.name}</span>
                    {tab.isDefault && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Default</span>
                    )}
                    {!tab.isDefault && (
                      <>
                        <button
                          onClick={() => { setEditingId(id); setEditName(tab.name); }}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>
    </motion.div>
  );
};

export default TabManager;
