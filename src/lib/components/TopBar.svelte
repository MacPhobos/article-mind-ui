<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	interface Props {
		appName?: string;
	}

	let { appName = 'Article Mind' }: Props = $props();

	// Determine active nav item based on current route
	let currentPath = $derived($page.url.pathname);
	let isSessionsActive = $derived(currentPath === '/' || currentPath.startsWith('/sessions'));
	let isAdminActive = $derived(currentPath.startsWith('/admin'));
</script>

<nav class="top-bar">
	<div class="logo">
		<a href={resolve('/')}>{appName}</a>
	</div>
	<ul class="nav-menu">
		<li class:active={isSessionsActive}>
			<a href={resolve('/')}>Sessions</a>
		</li>
		<li class:active={isAdminActive}>
			<a href={resolve('/admin')}>Admin</a>
		</li>
	</ul>
</nav>

<style>
	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 2rem;
		height: 60px;
		background: #1a1a2e;
		color: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.logo a {
		font-size: 1.5rem;
		font-weight: bold;
		color: white;
		text-decoration: none;
	}

	.nav-menu {
		display: flex;
		gap: 2rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.nav-menu li a {
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.nav-menu li a:hover {
		color: white;
		background: rgba(255, 255, 255, 0.1);
	}

	.nav-menu li.active a {
		color: white;
		background: rgba(255, 255, 255, 0.15);
	}
</style>
