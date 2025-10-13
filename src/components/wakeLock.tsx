'use client';
import { useEffect } from 'react';

export const WakeLock = () => {
  useEffect(() => {
    let captured = false;
    const lock = navigator.wakeLock.request('screen');
    console.log('aaaa');
    lock
      .then((l) => {
        console.debug('WakeLock acquired');
        captured = true;
        l.addEventListener('release', (e) => {
          console.debug('WakeLock released', e);
          captured = false;
        });
      })
      .catch((e) => {
        console.debug('WakeLock not available', e);
        captured = false;
      });
    return () => {
      lock
        .then((l) => {
          if (captured) {
            return l.release();
          }
        })
        .catch(console.debug);
    };
  }, []);
  return null;
};
