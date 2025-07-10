// pages/index.js
import { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((r) => r.json());

const QUESTIONS = [
  { id: 1, text: '…question text 1…' },
  { id: 2, text: '…question text 2…' },
  { id: 3, text: '…question text 3…' },
  { id: 4, text: '…question text 4…' },
  { id: 5, text: '…question text 5…' },
];

export default function Home() {
  /* …component code exactly as in our last React scaffold… */
}
