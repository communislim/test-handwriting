'use client';
import React, { useEffect, useRef, useState } from 'react'
import * as iink from 'iink-ts'

// Editor 타입을 직접 import 하지 않고 any로 처리
type EditorType = any;

const HandWritingPad = ({ onConvert }: { onConvert: (latex: string) => void }) => {
	const isEnableAutoConvert = useRef(false)
	const [disabledUndo, setDisabledUndo] = useState(true)
	const [disabledRedo, setDisabledRedo] = useState(true)
	const [disabledClear, setDisabledClear] = useState(true)

	useEffect(() => {
		const editorElement = document.getElementById('editor')!;
		const undoElement = document.getElementById('undo')!;
		const redoElement = document.getElementById('redo')!;
		const clearElement = document.getElementById('clear')!;

		async function loadEditor () {
			const options = {
				configuration: {
					server: {
						protocol: 'WEBSOCKET',
						scheme: 'https',
						host: 'cloud.myscript.com',
						applicationKey: process.env.NEXT_PUBLIC_APPLICATION_KEY!,
						hmacKey: process.env.NEXT_PUBLIC_HMAC_KEY!,
						version: '2.0.1',
						websocket: {
							autoReconnect: true,
						},
					},
					recognition: {
						type: 'MATH',
						alwaysConnected: true,
						math: {
							mimeTypes: ['application/x-latex'],
							'session-time': 100,
						},
					},
				},
			} as const

			const editor: EditorType = new (iink as any).Editor(editorElement, options)
			await editor.initialize()

			editor.events.addEventListener('exported', (event: any) => {
				const exports = event.detail
				if (exports?.['application/x-latex']) {
					const latex = exports['application/x-latex']
					onConvert(latex)

					if (isEnableAutoConvert.current) {
						editor.convert()
					}
				}
			})
			clearElement.addEventListener('click', async () => {
				editor.clear()
				setDisabledUndo(true)
				setDisabledRedo(true)
				setDisabledClear(true)
			})
			undoElement.addEventListener('click', () => {
				const context = editor.context
				if (context.canUndo) {
					editor.undo()
				}
			})
			redoElement.addEventListener('click', () => {
				const context = editor.context
				if (context.canRedo) {
					editor.redo()
				}
			})
			editorElement.addEventListener('changed', (event: any) => {
				if (event.detail.empty) {
					setDisabledUndo(true)
					setDisabledRedo(true)
					setDisabledClear(true)
					onConvert('')
				} else {
					setDisabledUndo(!event.detail.canUndo)
					setDisabledRedo(!event.detail.canRedo)
					setDisabledClear(!event.detail.canUndo)
				}
			})
		}

		loadEditor().catch((error) => console.error(error))
	}, []);

	return (
		<div id="hand-writing-pad" className="w-full h-full max-h-[280px] max-w-[800px] flex justify-center absolute bottom-0">
			<div id="editor" touch-action="none"
				className="
				w-full h-full
				min-h-[280px] max-w-[800px]
				bg-slate-100 rounded-2xl
				[background-image:radial-gradient(rgba(175,189,196,0.47)_2px,transparent_2px)] 
				[background-size:17px_17px]"
			>
			</div>
			<div id="hand-writing-pad-controls" className="flex flex-row justify-end gap-2 z-10 absolute right-3 top-3">
				<button
					id="undo"
					className={`p-2 rounded-md ${disabledUndo
						? 'bg-slate-200 text-slate-400 cursor-not-allowed'
						: 'bg-slate-400 hover:bg-slate-400'
						}`}
					disabled={disabledUndo}
				>
					undo
				</button>
				<button
					id="redo"
					className={`p-2 rounded-md ${disabledRedo
						? 'bg-slate-200 text-slate-400 cursor-not-allowed'
						: 'bg-slate-400 hover:bg-slate-400'
						}`}
					disabled={disabledRedo}
				>
					redo
				</button>
				<button
					id="clear"
					className={`p-2 rounded-md ${disabledClear
						? 'bg-slate-200 text-slate-400 cursor-not-allowed'
						: 'bg-slate-400 hover:bg-slate-400'
						}`}
					disabled={disabledClear}
				>
					clear
				</button>
			</div>
		</div >
	);
};

export default HandWritingPad;
