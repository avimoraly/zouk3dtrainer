export function gaEvent(name, params = {}) {
  if (typeof gtag !== 'undefined') {
    gtag('event', name, params);
  }
}

export function shareTrainer({ setShareMessage, shareToastTimerRef }) {
  return async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: 'Brazilian Zouk 3D Trainer',
      text: 'Try this interactive Brazilian Zouk 3D Trainer!',
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        gaEvent('share_pressed', { method: 'native' });
        setShareMessage('Shared successfully');
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        gaEvent('share_pressed', { method: 'clipboard' });
        setShareMessage('Link copied to clipboard');
      } else {
        window.prompt('Copy this link to share:', shareUrl);
        gaEvent('share_pressed', { method: 'prompt' });
        setShareMessage('Copy this link manually');
      }
    } catch (err) {
      if (err && err.name !== 'AbortError') {
        console.error('Share failed:', err);
        setShareMessage('Sharing is unavailable here');
      }
    }

    clearTimeout(shareToastTimerRef.current);
    shareToastTimerRef.current = setTimeout(() => setShareMessage(''), 1800);
  };
}
