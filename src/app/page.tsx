'use client';
import { useState, useCallback, useEffect } from 'react';
import HandWritingPad from '../components/hand-writing-pad';
import MathRenderer from '@/components/math-renderer';

export default function Home () {
  const [latex, setLatex] = useState('')
  const handleConvert = useCallback((latex: string) => {
    setLatex(latex)
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-between">
      <MathRenderer latex={latex} displayMode={true} />
      <HandWritingPad onConvert={handleConvert} />
    </div>
  );
}
