import { AdminTranslationsPanel } from '@/components/admin/translations/AdminTranslationsPanel';
import { listTranslationLanguages } from '@/services/admin/translations';

export default async function AdminTranslationsPage() {
  const languages = await listTranslationLanguages();
  const options = languages.length ? languages : ['en', 'rw'];

  return (
    <div className="space-y-6 p-6">
      <AdminTranslationsPanel languages={options} />
    </div>
  );
}

