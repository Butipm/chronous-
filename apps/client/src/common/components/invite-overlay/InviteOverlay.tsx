import { OntimeView } from 'ontime-types';
import { useEffect, useRef, useState } from 'react';
import { IoClose, IoPersonAddOutline } from 'react-icons/io5';

import { generateUrl } from '../../api/session';
import useInfo from '../../hooks-query/useInfo';
import { canCopyToClipboard, copyToClipboard } from '../../utils/copyToClipboard';
import { hostToBaseUrl } from '../../utils/linkUtils';
import { cx } from '../../utils/styleUtils';
import { serverURL } from '../../../externals';
import IconButton from '../buttons/IconButton';
import QRCode from '../qr-code/QrCode';
import Select from '../select/Select';

import './InviteOverlay.scss';

const roleOptions = [
  { value: OntimeView.Editor, label: 'Editor (full rundown editing)' },
  { value: 'timercontrol', label: 'Timer Control' },
  { value: OntimeView.Operator, label: 'Operator' },
  { value: OntimeView.Cuesheet, label: 'Cuesheet' },
];

const qrSize = 140;

/**
 * Lets whoever is standing at an output screen (Timer, Countdown, etc) invite a controller
 * or operator on the spot, without digging into Settings -> Sharing. Generates an unauthenticated
 * link + QR to the chosen role on this server's default address - for a specific network
 * interface, a locked-down link, or a Companion/cuesheet-permissions link, the full form in
 * Settings is still the place to go.
 */
export default function InviteOverlay({ className }: { className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [role, setRole] = useState<string>(roleOptions[0].value);
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: infoData } = useInfo();

  /**
   * serverURL is derived from window.location, so viewing this page at "localhost" (the
   * Electron app, or a browser tab opened on the host machine itself) makes serverURL
   * "http://localhost:...", which is meaningless to any other device - a phone scanning
   * the QR tries to reach itself. Swap in a real network interface address whenever the
   * page itself is being viewed over loopback, same as the host picker in the full
   * Settings -> Sharing form already has to do. The interfaces list itself also reports a
   * "localhost" / 127.0.0.1 entry (often first), so that has to be filtered out too, not
   * just the page's own hostname.
   */
  const resolveBaseUrl = (): string => {
    const { hostname } = window.location;
    const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const lanInterface = infoData.networkInterfaces.find(
      (nif) => nif.address !== '127.0.0.1' && nif.address !== '::1' && !nif.address.startsWith('127.'),
    );
    if (isLoopback && lanInterface) {
      return hostToBaseUrl(lanInterface.address, infoData.serverPort);
    }
    return serverURL;
  };

  const generate = async (path: string) => {
    setStatus('loading');
    setUrl('');
    try {
      const generated = await generateUrl({
        baseUrl: resolveBaseUrl(),
        path,
        authenticate: false,
        lockConfig: false,
        lockNav: false,
      });
      setUrl(generated);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    if (isExpanded && !url && status === 'idle') {
      generate(role);
    }
    // only generate the first time the panel opens - role changes have their own handler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  // close on a click outside the panel, and on Escape - same convention as UrlFeedOverlay.
  // The role Select renders its dropdown in a portal (appended to the end of <body>), so it is
  // never a DOM descendant of containerRef even while visually inside the panel - without this
  // extra check, picking a role would look like a click "outside" and close the whole thing.
  useEffect(() => {
    if (!isExpanded) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[role="listbox"], [role="option"]')) return;
      setIsExpanded(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExpanded(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  const handleRoleChange = (value: string | null) => {
    if (!value) return;
    setRole(value);
    generate(value);
  };

  const handleCopy = async () => {
    if (!url) return;
    try {
      if (!(await copyToClipboard(url))) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore errors
    }
  };

  return (
    <div ref={containerRef} className={cx(['invite-overlay', isExpanded && 'invite-overlay--expanded', className])}>
      <IconButton
        type='button'
        aria-label={isExpanded ? 'Close invite panel' : 'Invite a controller or operator'}
        variant={isExpanded ? 'primary' : 'subtle-white'}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <IoPersonAddOutline />
      </IconButton>

      {isExpanded && (
        <div className='invite-overlay__panel'>
          <div className='invite-overlay__header'>
            <Select options={roleOptions} value={role} onValueChange={handleRoleChange} />
            <IconButton type='button' aria-label='Close' variant='subtle-white' onClick={() => setIsExpanded(false)}>
              <IoClose />
            </IconButton>
          </div>
          <div className='invite-overlay__qr'>
            {url ? <QRCode size={qrSize} value={url} /> : <div className='invite-overlay__qr-placeholder' />}
          </div>
          <div className='invite-overlay__link'>
            {status === 'error' ? 'Could not generate a link' : url || 'Generating…'}
          </div>
          <button
            type='button'
            className='invite-overlay__copy'
            onClick={handleCopy}
            disabled={!url || !canCopyToClipboard()}
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  );
}
