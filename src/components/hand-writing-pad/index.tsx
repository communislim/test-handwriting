'use client';
import React, { useEffect, useRef, useState } from 'react'
import * as iink from 'iink-ts'
import '../../app/editor-classes.css'
import { InternalEventType } from 'iink-ts';

const HandWritingPad = ({ onConvert }: { onConvert: (latex: string) => void }) => {
	const isEnableAutoConvert = useRef(false)
	const [disabledUndo, setDisabledUndo] = useState(true)
	const [disabledRedo, setDisabledRedo] = useState(true)
	const [disabledClear, setDisabledClear] = useState(true)
	const editorElement = useRef<HTMLElement | null>(null)
	const undoElement = useRef<HTMLElement | null>(null)
	const redoElement = useRef<HTMLElement | null>(null)
	const clearElement = useRef<HTMLElement | null>(null)
	const editorRef = useRef<iink.Editor | null>(null);

	async function loadEditor() {
		if (editorRef.current) {
			editorRef.current = null;
		}

		editorElement.current = null
		undoElement.current = null
		redoElement.current = null
		clearElement.current = null

		editorElement.current = document.getElementById('editor')
		undoElement.current = document.getElementById('undo')
		redoElement.current = document.getElementById('redo')
		clearElement.current = document.getElementById('clear')

		const editor = new iink.Editor(editorElement.current!, {
			configuration: {
				server: {
					protocol: 'WEBSOCKET' as const,
					scheme: 'https',
					host: 'cloud.myscript.com',
					applicationKey: process.env.NEXT_PUBLIC_APPLICATION_KEY!,
					hmacKey: process.env.NEXT_PUBLIC_HMAC_KEY!,
					version: '2.0.1',
					websocket: {
						autoReconnect: true,
						pingEnabled: true,
						pingDelay: 10000,
						maxRetryCount: 10,
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
		})
		await editor.initialize()

		const handleLoaded = (event: any) => {
			console.log('loaded')
		}

		const handleExported = (event: any) => {
			const exports = event.detail
			if (exports?.['application/x-latex']) {
				const latex = exports['application/x-latex']
				console.log('exported: ', latex)
				onConvert(latex)

				if (isEnableAutoConvert.current) {
					editor.convert()
				}
			}
		}

		const handleError = async (event: any) => {
			const error = event.detail
			console.log('Editor error:', error)

			if (error.message.includes('Session closed')) {
				try {
					console.log('Reconnecting...')
				} catch (reconnectError) {
					console.error('Failed to reconnect:', reconnectError)
				}
			}
		}

		const interval = setInterval(() => {
			console.log('interval importPointEvents');
			editor.importPointEvents([]);
		}, 10 * 1000);

		editor.events.addEventListener('loaded', handleLoaded)
		editor.events.addEventListener('exported', handleExported)
		editor.internalEvents.addEventListener(InternalEventType.ERROR, handleError)

		clearElement.current?.addEventListener('click', async () => {
			editor.clear()
			setDisabledUndo(true)
			setDisabledRedo(true)
			setDisabledClear(true)
		})
		undoElement.current?.addEventListener('click', () => {
			const context = editor.context
			if (context.canUndo) {
				editor.undo()
			}
		})
		redoElement.current?.addEventListener('click', () => {
			const context = editor.context
			if (context.canRedo) {
				editor.redo()
			}
		})
		editorElement.current?.addEventListener('changed', (event: any) => {
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

		window.addEventListener("beforeunload", () => {
			clearInterval(interval);
			editor.events.removeEventListener('loaded', handleLoaded)
			editor.events.removeEventListener('exported', handleExported)
			editor.internalEvents.removeEventListener(InternalEventType.ERROR, handleError)
		});
	}

	useEffect(() => {
		loadEditor()
			.then()
			.catch((error) => {
				console.error(error)
			});
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
