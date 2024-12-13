'use client'
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { useEffect, useRef } from 'react';

interface MathRendererProps {
	latex: string;
	displayMode?: boolean;
}

const MathRenderer = ({ latex, displayMode = true }: MathRendererProps) => {
	console.log('🚀 ~ MathRenderer ~ latex:', latex)
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (containerRef.current) {
			if (!latex) {
				containerRef.current.innerHTML = '';
				return;
			}

			try {
				katex.render(latex, containerRef.current, {
					displayMode: displayMode,
					throwOnError: false,
					trust: true,
					strict: false
				});
			} catch (error) {
				console.error('LaTeX 렌더링 오류:', error);
			}
		}
	}, [latex, displayMode]);

	return (
		<div
			ref={containerRef}
			className="w-full h-full bg-slate-100 text-center p-10
			text-4xl
			min-h-[204px] max-w-[800px]"
		/>
	);
};

export default MathRenderer;