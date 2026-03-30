import { motion } from 'framer-motion';
import { Store, Trash2, User, Tag, GripVertical } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  id: string;
  name: string;
  due: number;
  iOweDue?: number;
  theyOweDue?: number;
  lastActivity?: string;
  tabId?: string;
  onClick: () => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
}

const ShopCard = ({ name, due, iOweDue = 0, theyOweDue = 0, lastActivity, tabId, onClick, onDelete, dragHandleProps }: Props) => {
  const colorClass = due <= 0 ? 'bg-payment' : due <= 200 ? 'bg-payment' : due <= 500 ? 'bg-warning' : 'bg-credit';
  const Icon = tabId === 'persons' ? User : tabId === 'shops' ? Store : Tag;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative bg-card rounded-2xl shadow-sm border border-border overflow-hidden cursor-pointer active:shadow-md transition-shadow"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colorClass}`} />
      <div className="p-4 pl-5 flex items-center gap-3">
        {dragHandleProps && (
          <div {...dragHandleProps} onClick={e => e.stopPropagation()} className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground -ml-1">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground truncate">{name}</h3>
          {lastActivity && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(lastActivity), 'dd MMM yyyy')}
            </p>
          )}
          {(iOweDue > 0 || theyOweDue > 0) && (
            <div className="flex gap-2 mt-0.5">
              {iOweDue > 0 && <span className="text-[10px] text-credit font-medium">I owe ₹{iOweDue}</span>}
              {theyOweDue > 0 && <span className="text-[10px] text-payment font-medium">They owe ₹{theyOweDue}</span>}
            </div>
          )}
        </div>
        <div className="text-right shrink-0 flex items-center gap-2">
          <div>
            <p className={`text-lg font-bold ${due > 0 ? 'text-credit' : 'text-payment'}`}>
              ₹{Math.abs(due)}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              {due > 0 ? 'I owe' : due === 0 ? 'settled' : 'they owe'}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ShopCard;
