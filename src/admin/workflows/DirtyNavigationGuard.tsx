import { useCallback } from 'react';
import {
  useBeforeUnload,
  useBlocker,
  type BlockerFunction,
} from 'react-router-dom';
import { useSite } from '@/app/site';
import { ConfirmDialog } from '@/admin/AdminOverlays';
import type { DocumentMutation } from '@/admin/documents';

type DirtyNavigationGuardProps = {
  readonly dirty: boolean;
  readonly pendingOperation?: DocumentMutation | null;
};

export function DirtyNavigationGuard({ dirty, pendingOperation = null }: DirtyNavigationGuardProps) {
  const { isZh } = useSite();
  const blocked = dirty || pendingOperation !== null;
  const shouldBlock = useCallback<BlockerFunction>(({ currentLocation, nextLocation }) => (
    blocked && (
      currentLocation.pathname !== nextLocation.pathname ||
      currentLocation.search !== nextLocation.search ||
      currentLocation.hash !== nextLocation.hash
    )
  ), [blocked]);
  const blocker = useBlocker(shouldBlock);

  useBeforeUnload(useCallback((event) => {
    if (!blocked) return;
    event.preventDefault();
    event.returnValue = '';
  }, [blocked]));

  const pending = pendingOperation !== null;

  const stay = () => {
    if (blocker.state === 'blocked') blocker.reset();
  };
  const leave = () => {
    if (blocker.state === 'blocked') blocker.proceed();
  };

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      dismissible={false}
      warning
      title={pending
        ? (isZh ? '內容作業仍在進行，仍要離開？' : 'Leave while the content operation is pending?')
        : (isZh ? '離開並放棄未儲存的變更？' : 'Leave and discard unsaved changes?')}
      description={pending
        ? (isZh ? '離開會取消等待中的作業，但伺服器結果可能仍需重新載入確認。' : 'Leaving cancels the pending request, but the server outcome may still require a reload to confirm.')
        : (isZh ? '目前編輯內容尚未儲存，離開後將無法復原。' : 'Your current edits are not saved and cannot be recovered after leaving.')}
      body={pending
        ? (isZh ? '選擇繼續等待，或確認離開此頁。' : 'Keep waiting, or confirm that you want to leave this page.')
        : (isZh ? '選擇繼續編輯以保留目前內容，或確認離開此頁。' : 'Keep editing to preserve the current content, or confirm that you want to leave.')}
      closeLabel={isZh ? '關閉對話框' : 'Close dialog'}
      cancelLabel={pending ? (isZh ? '繼續等待' : 'Keep waiting') : (isZh ? '繼續編輯' : 'Keep editing')}
      confirmLabel={isZh ? '離開此頁' : 'Leave this page'}
      onClose={stay}
      onConfirm={leave}
    />
  );
}
