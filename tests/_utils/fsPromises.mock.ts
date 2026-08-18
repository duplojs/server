const fsPromisesMock = {
	readFile: vi.fn(),
	writeFile: vi.fn(),
	appendFile: vi.fn(),
	access: vi.fn(),
	stat: vi.fn(),
	lstat: vi.fn(),
	realpath: vi.fn(),
	readdir: vi.fn(),
	mkdir: vi.fn(),
	rm: vi.fn(),
	cp: vi.fn(),
	rename: vi.fn(),
	truncate: vi.fn(),
	chmod: vi.fn(),
	chown: vi.fn(),
	utimes: vi.fn(),
	symlink: vi.fn(),
	readlink: vi.fn(),
	link: vi.fn(),
	mkdtemp: vi.fn(),
	open: vi.fn(),
};

vi.mock("node:fs/promises", () => fsPromisesMock);

export function getFsPromisesMock() {
	return fsPromisesMock;
}

export function setFsPromisesMock(
	overrides: Partial<typeof fsPromisesMock>,
) {
	for (const key of Object.keys(overrides) as (keyof typeof fsPromisesMock)[]) {
		const value = overrides[key];
		if (value) {
			fsPromisesMock[key] = value;
		}
	}
	return fsPromisesMock;
}
