<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let cursorEl: HTMLDivElement;
	let isHovering = $state(false);
	let isClicking = $state(false);

	interface Position {
		distanceX: number;
		distanceY: number;
		distance: number;
		pointerX: number;
		pointerY: number;
	}

	class ArrowPointer {
		root: HTMLElement;
		cursor: HTMLDivElement;
		position: Position;
		previousPointerX: number;
		previousPointerY: number;
		angle: number;
		previousAngle: number;
		angleDisplace: number;
		degrees: number;
		cursorSize: number;
		cursorStyle: Partial<CSSStyleDeclaration>;

		constructor(cursorElement: HTMLDivElement) {
			this.root = document.body;
			this.cursor = cursorElement;

			this.position = {
				distanceX: 0,
				distanceY: 0,
				distance: 0,
				pointerX: 0,
				pointerY: 0
			};
			this.previousPointerX = 0;
			this.previousPointerY = 0;
			this.angle = 0;
			this.previousAngle = 0;
			this.angleDisplace = 0;
			this.degrees = 57.296;
			this.cursorSize = 20;

			this.cursorStyle = {
				boxSizing: 'border-box',
				position: 'fixed',
				top: '0px',
				left: `${-this.cursorSize / 2}px`,
				zIndex: '2147483647',
				width: `${this.cursorSize}px`,
				height: `${this.cursorSize}px`,
				transition: '250ms, transform 100ms',
				userSelect: 'none',
				pointerEvents: 'none'
			};

			this.init(this.cursor, this.cursorStyle);
		}

		init(el: HTMLDivElement, style: Partial<CSSStyleDeclaration>) {
			Object.assign(el.style, style);
			this.cursor.removeAttribute('hidden');
		}

		move(event: MouseEvent) {
			this.previousPointerX = this.position.pointerX;
			this.previousPointerY = this.position.pointerY;
			this.position.pointerX = event.clientX;
			this.position.pointerY = event.clientY;
			this.position.distanceX = this.previousPointerX - this.position.pointerX;
			this.position.distanceY = this.previousPointerY - this.position.pointerY;
			this.distance = Math.sqrt(this.position.distanceY ** 2 + this.position.distanceX ** 2);

			// Check if hovering over clickable element
			const target = event.target as HTMLElement;
			const isClickable =
				target.tagName === 'BUTTON' ||
				target.tagName === 'A' ||
				(target as HTMLInputElement).type === 'submit' ||
				(target as HTMLInputElement).type === 'button' ||
				target.closest('a, button') !== null;
			isHovering = isClickable;

			if (isHovering) {
				this.cursor.style.transform = `translate3d(${this.position.pointerX}px, ${this.position.pointerY}px, 0)`;
			} else if (this.distance > 1) {
				this.rotate(this.position);
			} else {
				this.cursor.style.transform = `translate3d(${this.position.pointerX}px, ${this.position.pointerY}px, 0) rotate(${this.angleDisplace}deg)`;
			}
		}

		rotate(position: Position) {
			let unsortedAngle =
				Math.atan(Math.abs(position.distanceY) / Math.abs(position.distanceX)) * this.degrees;
			this.previousAngle = this.angle;

			if (position.distanceX <= 0 && position.distanceY >= 0) {
				this.angle = 90 - unsortedAngle;
			} else if (position.distanceX < 0 && position.distanceY < 0) {
				this.angle = unsortedAngle + 90;
			} else if (position.distanceX >= 0 && position.distanceY <= 0) {
				this.angle = 90 - unsortedAngle + 180;
			} else if (position.distanceX > 0 && position.distanceY > 0) {
				this.angle = unsortedAngle + 270;
			}

			if (isNaN(this.angle)) {
				this.angle = this.previousAngle;
			} else {
				if (this.angle - this.previousAngle <= -270) {
					this.angleDisplace += 360 + this.angle - this.previousAngle;
				} else if (this.angle - this.previousAngle >= 270) {
					this.angleDisplace += this.angle - this.previousAngle - 360;
				} else {
					this.angleDisplace += this.angle - this.previousAngle;
				}
			}

			this.cursor.style.transform = `translate3d(${this.position.pointerX}px, ${this.position.pointerY}px, 0) rotate(${this.angleDisplace}deg)`;
		}

		remove() {
			this.cursor.remove();
		}
	}

	onMount(() => {
		if (!browser) return;

		// Handle click animation
		const handleMouseDown = () => {
			isClicking = true;
		};

		const handleMouseUp = () => {
			setTimeout(() => {
				isClicking = false;
			}, 150);
		};

		document.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('mouseup', handleMouseUp);

		const cursor = new ArrowPointer(cursorEl);
		if (
			!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
		) {
			let rafId: number;
			document.onmousemove = function (event) {
				if (rafId) cancelAnimationFrame(rafId);
				rafId = requestAnimationFrame(() => cursor.move(event));
			};

			// Hide system cursor
			document.documentElement.style.cursor = 'none';
			document.body.style.cursor = 'none';
		} else {
			cursor.remove();
		}

		return () => {
			document.removeEventListener('mousedown', handleMouseDown);
			document.removeEventListener('mouseup', handleMouseUp);
			document.documentElement.style.cursor = 'auto';
			document.body.style.cursor = 'auto';
		};
	});
</script>

<div class="curzr" bind:this={cursorEl} hidden>
	{#if isHovering}
		<div class="circle-cursor" class:clicking={isClicking}>
			<div class="dot"></div>
		</div>
	{:else}
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
			<path
				class="inner"
				d="M25,30a5.82,5.82,0,0,1-1.09-.17l-.2-.07-7.36-3.48a.72.72,0,0,0-.35-.08.78.78,0,0,0-.33.07L8.24,29.54a.66.66,0,0,1-.2.06,5.17,5.17,0,0,1-1,.15,3.6,3.6,0,0,1-3.29-5L12.68,4.2a3.59,3.59,0,0,1,6.58,0l9,20.74A3.6,3.6,0,0,1,25,30Z"
				fill="#F2F5F8"
			/>
			<path
				class="outer"
				d="M16,3A2.59,2.59,0,0,1,18.34,4.6l9,20.74A2.59,2.59,0,0,1,25,29a5.42,5.42,0,0,1-.86-.15l-7.37-3.48a1.84,1.84,0,0,0-.77-.17,1.69,1.69,0,0,0-.73.16l-7.4,3.31a5.89,5.89,0,0,1-.79.12,2.59,2.59,0,0,1-2.37-3.62L13.6,4.6A2.58,2.58,0,0,1,16,3m0-2h0A4.58,4.58,0,0,0,11.76,3.8L2.84,24.33A4.58,4.58,0,0,0,7,30.75a6.08,6.08,0,0,0,1.21-.17,1.87,1.87,0,0,0,.4-.13L16,27.18l7.29,3.44a1.64,1.64,0,0,0,.39.14A6.37,6.37,0,0,0,25,31a4.59,4.59,0,0,0,4.21-6.41l-9-20.75A4.62,4.62,0,0,0,16,1Z"
				fill="#111920"
			/>
		</svg>
	{/if}
</div>

<style>
	:global(body *) {
		cursor: none !important;
	}

	.circle-cursor {
		width: 100%;
		height: 100%;
		border: 2px solid var(--fg-main);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}

	.circle-cursor.clicking {
		transform: scale(0.7);
	}

	.dot {
		width: 4px;
		height: 4px;
		background: var(--fg-main);
		border-radius: 50%;
	}
</style>
