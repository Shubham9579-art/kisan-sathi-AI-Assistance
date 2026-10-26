import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';
import { FieldItem } from '../types';
import { FieldCard } from '../components/fields/FieldCard';
import { FieldModal } from '../components/fields/FieldModal';
import { ObservationModal } from '../components/fields/ObservationModal';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { EmptyState } from '../components/shared/EmptyState';
import { Plus, Trees, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const FieldsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editingField, setEditingField] = useState<FieldItem | null>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [activeObservation, setActiveObservation] = useState<{
    fieldId: number;
    initialNotes?: string;
  } | null>(null);
  const [loadedFor, setLoadedFor] = useState<number | null | undefined>(undefined);
  const requestVersion = useRef(0);

  const fetchFields = () => {
    if (authLoading) return;
    const requestId = ++requestVersion.current;
    setLoading(true);
    setLoadError(false);
    api.getFields()
      .then((items) => {
        if (requestId !== requestVersion.current) return;
        setFields(items);
        setLoadedFor(user?.id ?? null);
      })
      .catch((err) => {
        if (requestId === requestVersion.current) {
          console.error('Failed to load fields:', err);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (requestId === requestVersion.current) setLoading(false);
      });
  };

  useEffect(() => {
    if (authLoading) return;
    setFields([]);
    setLoadedFor(undefined);
    setLoadError(false);
    setEditingField(null);
    setShowFieldModal(false);
    setActiveObservation(null);
    fetchFields();
    return () => {
      requestVersion.current += 1;
    };
  }, [authLoading, user?.id]);

  const handleSaveField = async (data: any) => {
    if (editingField) {
      const updated = await api.updateField(editingField.id, data);
      setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    } else {
      const created = await api.createField(data);
      setFields((prev) => [created, ...prev]);
    }
  };

  const handleDeleteField = async (id: number) => {
    if (window.confirm(t.fields.confirmDelete)) {
      await api.deleteField(id);
      setFields((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleSaveObservation = async (fieldId: number, data: any) => {
    const newObs = await api.addObservation(fieldId, data);
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          return {
            ...f,
            observations: [newObs, ...(f.observations || [])],
          };
        }
        return f;
      })
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-forest-950 tracking-tight">{t.fields.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{t.fields.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFields}
            className="p-2.5 rounded-xl bg-white border border-cream-200 hover:bg-cream-100 text-gray-600 transition-colors"
            title={t.ui.refresh}
          >
            <RefreshCw size={15} />
          </button>

          {user && (
            <button
              onClick={() => {
                setEditingField(null);
                setShowFieldModal(true);
              }}
              className="px-4 py-2.5 bg-forest-900 hover:bg-forest-950 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus size={16} />
              <span>{t.fields.addField}</span>
            </button>
          )}
        </div>
      </div>

      {!user && loadedFor === null && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
          <p>{t.ui.privateDataDescription}</p>
          <Link to="/account" className="shrink-0 rounded-lg bg-forest-900 px-3 py-2 text-center text-xs font-bold text-white">
            {t.ui.signUp}
          </Link>
        </div>
      )}

      {authLoading || loading ? (
        <LoadingSpinner message={t.ui.fieldsLoading} />
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          <p>{t.ui.fieldsLoadError}</p>
          <button onClick={fetchFields} className="mt-3 rounded-lg bg-forest-900 px-3 py-2 text-xs font-bold text-white">
            {t.common.retry}
          </button>
        </div>
      ) : loadedFor !== (user?.id ?? null) ? (
        <LoadingSpinner message={t.ui.fieldsLoading} />
      ) : fields.length === 0 ? (
        <EmptyState
          icon={Trees}
          title={t.fields.noFields}
          description={t.ui.fieldEmptyDescription}
          actionText={user ? t.fields.addField : undefined}
          onAction={user ? () => {
            setEditingField(null);
            setShowFieldModal(true);
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map((f) => (
            <FieldCard
              key={f.id}
              field={f}
              readOnly={!user}
              onEdit={(field) => {
                setEditingField(field);
                setShowFieldModal(true);
              }}
              onDelete={handleDeleteField}
              onAddObservation={(fieldId, initialNotes) => setActiveObservation({ fieldId, initialNotes })}
            />
          ))}
        </div>
      )}

      {/* Field Create/Edit Modal */}
      {showFieldModal && loadedFor === (user?.id ?? null) && (
        <FieldModal
          field={editingField}
          onClose={() => setShowFieldModal(false)}
          onSave={handleSaveField}
        />
      )}

      {/* Add Observation Modal */}
      {activeObservation !== null && loadedFor === (user?.id ?? null) && (
        <ObservationModal
          fieldId={activeObservation.fieldId}
          initialNotes={activeObservation.initialNotes}
          onClose={() => setActiveObservation(null)}
          onSave={handleSaveObservation}
        />
      )}
    </div>
  );
};
