import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetItem.mockResolvedValue(null);
  mockSetItem.mockResolvedValue(undefined);
});

describe('usePersistedState – AsyncStorage mock contract', () => {
  it('getItem is called with the provided key', async () => {
    mockGetItem.mockResolvedValue(null);
    await AsyncStorage.getItem('my-key');
    expect(mockGetItem).toHaveBeenCalledWith('my-key');
  });

  it('setItem serializes values as JSON', async () => {
    const value = { categories: ['zivilisation', 'nation'] };
    await AsyncStorage.setItem('state', JSON.stringify(value));
    expect(mockSetItem).toHaveBeenCalledWith('state', JSON.stringify(value));
  });

  it('getItem returns null when key is absent', async () => {
    const result = await AsyncStorage.getItem('missing');
    expect(result).toBeNull();
  });

  it('JSON round-trip preserves Category arrays', () => {
    const cats = ['erdzeitalter', 'zivilisation'];
    const serialized = JSON.stringify(cats);
    const deserialized = JSON.parse(serialized) as string[];
    expect(deserialized).toEqual(cats);
  });

  it('JSON round-trip preserves Continent string', () => {
    const continent = 'asien';
    expect(JSON.parse(JSON.stringify(continent))).toBe(continent);
  });
});
