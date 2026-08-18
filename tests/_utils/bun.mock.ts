interface BunFileMock {
	bytes?(): Promise<Uint8Array>;
	text?(): Promise<string>;
	write?(data: Uint8Array | string): Promise<void>;
	exists?(): Promise<boolean>;
	stat?(): Promise<unknown>;
}

interface BunMock {
	file(path: string): BunFileMock;
	env?: Partial<Record<string, string>>;
}

const globalWithBun = globalThis as unknown as { Bun?: BunMock };

export function setBunMock(mock: BunMock) {
	globalWithBun.Bun = mock;
}

export function clearBunMock() {
	delete globalWithBun.Bun;
}
