import { t, type Lang } from '../i18n';
import { BackupFormatError, importBackup, parseBackup } from '../storage/backup';
import type { Profile } from '../storage/db';

/**
 * "Load backup" file picker. Used in the parent area and on the very first screen
 * of a new device, so progress can be moved over before any profile exists.
 */
export function LoadBackupButton({
  lang,
  onLoaded,
  onError,
}: {
  lang: Lang;
  onLoaded: (profiles: Profile[], message: string) => void;
  onError: (message: string) => void;
}) {
  const load = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow choosing the same file again
    if (!file) return;
    try {
      const backup = parseBackup(await file.text());
      const date = new Date(backup.exportedAt).toLocaleDateString(lang);
      const names = backup.profiles.map((p) => p.name).join(', ');
      if (!confirm(t(lang, 'parent.backupConfirm', { date, names }))) return;
      const result = await importBackup(backup);
      onLoaded(result.profiles, t(lang, 'parent.backupDone', { added: result.added, merged: result.merged }));
    } catch (err) {
      if (!(err instanceof BackupFormatError)) console.error(err);
      onError(t(lang, 'parent.backupError'));
    }
  };
  return (
    <label class="btn file-btn">
      📂 {t(lang, 'parent.backupLoad')}
      <input type="file" accept="application/json,.json" onChange={load} />
    </label>
  );
}
