<script lang="ts">
	interface Props {
		title: string;
		description: string;
		icon: string;
		onclick: () => void;
		disabled?: boolean;
	}

	let { title, description, icon, onclick, disabled = false }: Props = $props();
</script>

<button class="admin-task-card" {onclick} {disabled} aria-label={title}>
	<div class="card-icon">{icon}</div>
	<div class="card-content">
		<h3 class="card-title">{title}</h3>
		<p class="card-description">{description}</p>
	</div>
</button>

<style>
	.admin-task-card {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.5rem;
		background: white;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;
	}

	.admin-task-card:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border-color: #1976d2;
	}

	.admin-task-card:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: #f5f5f5;
	}

	.card-icon {
		font-size: 2rem;
		min-width: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-content {
		flex: 1;
	}

	.card-title {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		color: #333;
		font-weight: 600;
	}

	.card-description {
		margin: 0;
		font-size: 0.875rem;
		color: #666;
		line-height: 1.5;
	}
</style>
