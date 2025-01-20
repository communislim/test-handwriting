'use client';
import React, { useEffect, useRef, useState } from 'react'
import * as iink from 'iink-ts'
import '../../app/editor-classes.css'
import { InternalEventType, TOIMessageEventError } from 'iink-ts';

const HandWritingPad = ({ onConvert }: { onConvert: (latex: string) => void }) => {
	const isEnableAutoConvert = useRef(false)
	const [disabledUndo, setDisabledUndo] = useState(true)
	const [disabledRedo, setDisabledRedo] = useState(true)
	const [disabledClear, setDisabledClear] = useState(true)
	const editorElement = useRef<HTMLElement | null>(null)
	const undoElement = useRef<HTMLElement | null>(null)
	const redoElement = useRef<HTMLElement | null>(null)
	const clearElement = useRef<HTMLElement | null>(null)

	async function loadEditor() {
		if (editorElement.current) {
			editorElement.current = null
			undoElement.current = null
			redoElement.current = null
			clearElement.current = null
		}

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
		// let exportedTimer: number

		// const keepAliveEditor = async () => {
		// 	clearTimeout(exportedTimer)
		// 	if (!editor) return

		// 	console.log('keepAliveEditor')
		// 	try {
		// 		await editor.clear()

		// 		await loadEditor()
		// 	} catch (error) {
		// 		console.error('Keep alive failed:', error)
		// 	}
		// }

		editor.internalEvents.addEventListener(InternalEventType.ERROR, async (event: any) => {
			const error = event.detail
			console.log('Editor error:', error)

			if (error.message.includes('Session closed')) {
				try {
					console.log('Reconnecting...')
					await editor.clear()
					await loadEditor()
				} catch (reconnectError) {
					console.error('Failed to reconnect:', reconnectError)
				}
			}
		})

		editor.events.addEventListener('loaded', (event: any) => {
			console.log('loaded')
		})

		editor.events.addEventListener('exported', (event: any) => {
			const exports = event.detail
			if (exports?.['application/x-latex']) {
				const latex = exports['application/x-latex']
				console.log('exported: ', latex)
				onConvert(latex)

				// if (exportedTimer) {
				// 	clearTimeout(exportedTimer)
				// }
				// exportedTimer = window.setTimeout(keepAliveEditor, 5000)

				if (isEnableAutoConvert.current) {
					editor.convert()
				}
			}
		})

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
	}

	useEffect(() => {
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
