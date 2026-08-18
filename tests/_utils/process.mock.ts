interface ProcessMock {
	cwd?(): string;
	chdir?(path: string): void;
}

export function setProcessMock(mock: ProcessMock) {
	if (mock.cwd) {
		process.cwd = mock.cwd;
	}
	if (mock.chdir) {
		process.chdir = mock.chdir;
	}
}
