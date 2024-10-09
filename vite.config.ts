import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
    const envDir = process.cwd() + '/environment';
    const env = loadEnv(mode, envDir)
    return {
        envDir,
        base: env.VITE_BASE || '/',
    }
});