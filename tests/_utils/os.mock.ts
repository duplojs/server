const osMock = {
	tmpdir: vi.fn(),
};

vi.mock("node:os", () => osMock);

export function getOsMock() {
	return osMock;
}

export function setOsMock(overrides: Partial<typeof osMock>) {
	for (const key of Object.keys(overrides) as (keyof typeof osMock)[]) {
		const value = overrides[key];
		if (value) {
			osMock[key] = value;
		}
	}
	return osMock;
}
