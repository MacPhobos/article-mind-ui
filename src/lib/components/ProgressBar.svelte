<script lang="ts">
	interface Props {
		value: number; // 0-100
		label?: string;
		variant?: 'default' | 'success' | 'error';
		indeterminate?: boolean;
	}

	let { value = 0, label, variant = 'default', indeterminate = false }: Props = $props();

	// Clamp value between 0 and 100
	let clampedValue = $derived(Math.min(Math.max(value, 0), 100));

	// Variant color mapping
	let variantColor = $derived(() => {
		switch (variant) {
			case 'success':
				return 'progress-success';
			case 'error':
				return 'progress-error';
			default:
				return 'progress-default';
		}
	});
</script>

<div class="progress-container">
	{#if label}
		<div class="progress-label">{label}</div>
	{/if}
	<div class="progress-bar" role="progressbar" aria-valuenow={clampedValue} aria-valuemin="0" aria-valuemax="100">
		<div
			class="progress-fill {variantColor()} {indeterminate ? 'indeterminate' : ''}"
			style="width: {indeterminate ? '100%' : `${clampedValue}%`}"
		></div>
	</div>
	{#if !indeterminate && !label}
		<div class="progress-text">{clampedValue}%</div>
	{/if}
</div>

<style>
	.progress-container {
		width: 100%;
	}

	.progress-label {
		font-size: 0.875rem;
		color: #666;
		margin-bottom: 0.5rem;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: #e0e0e0;
		border-radius: 4px;
		overflow: hidden;
		position: relative;
	}

	.progress-fill {
		height: 100%;
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.progress-default {
		background: #1976d2;
	}

	.progress-success {
		background: #388e3c;
	}

	.progress-error {
		background: #d32f2f;
	}

	.progress-fill.indeterminate {
		animation: indeterminate 1.5s infinite;
		background: linear-gradient(90deg, #1976d2 0%, #42a5f5 50%, #1976d2 100%);
		background-size: 200% 100%;
	}

	@keyframes indeterminate {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.progress-text {
		font-size: 0.75rem;
		color: #666;
		text-align: right;
		margin-top: 0.25rem;
	}
</style>
