const cryptoMock = {
	randomUUID: vi.fn(),
};

vi.mock("node:crypto", () => cryptoMock);

export function getCryptoMock() {
	return cryptoMock;
}

export function setCryptoMock(overrides: Partial<typeof cryptoMock>) {
	for (const key of Object.keys(overrides) as (keyof typeof cryptoMock)[]) {
		const value = overrides[key];
		if (value) {
			cryptoMock[key] = value;
		}
	}
	return cryptoMock;
}
