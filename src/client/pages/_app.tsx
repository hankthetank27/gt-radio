import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // @ts-ignore
    var _mtm = window._mtm = window._mtm || [];
    _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    // @ts-ignore
    g.async=true; g.src='https://matomo-app.fly.dev/js/container_3enGOz0v.js'; s.parentNode.insertBefore(g,s);
  }, [])
  return <Component {...pageProps} />
}
