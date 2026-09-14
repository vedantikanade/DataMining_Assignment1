const { Expense, ExpenseTracker } = require('../script.js');

function createLocalStorageMock() {
    let store = {};
    return {
        getItem: jest.fn((key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null)),
        setItem: jest.fn((key, value) => {
            store[key] = String(value);
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        _dump: () => store,
    };
}

describe('ExpenseTracker', () => {
    let localStorageMock;

    beforeEach(() => {
        localStorageMock = createLocalStorageMock();
        Object.defineProperty(global, 'localStorage', {
            value: localStorageMock,
            configurable: true,
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    function makeTracker(key = 'expenses') {
        return new ExpenseTracker(key);
    }

    function sampleExpense(overrides = {}) {
        return {
            amount: 12.5,
            description: '  Coffee  ',
            category: '  Food  ',
            date: '2026-09-12',
            ...overrides,
        };
    }

    describe('constructor and storage', () => {
        test('starts with an empty list when storage is empty', () => {
            const tracker = makeTracker();
            expect(tracker.getAllExpenses()).toEqual([]);
            expect(localStorage.getItem).toHaveBeenCalledWith('expenses');
        });

        test('uses a custom storage key', () => {
            makeTracker('my-expenses');
            expect(localStorage.getItem).toHaveBeenCalledWith('my-expenses');
        });

        test('hydrates Expense instances from stored JSON', () => {
            localStorage.setItem(
                'expenses',
                JSON.stringify([
                    { id: 'abc', amount: 9.99, description: 'Bus', category: 'Transport', date: '2026-01-01' },
                ])
            );
            const tracker = makeTracker();
            const [expense] = tracker.getAllExpenses();
            expect(expense).toBeInstanceOf(Expense);
            expect(expense).toMatchObject({
                id: 'abc',
                amount: 9.99,
                description: 'Bus',
                category: 'Transport',
                date: '2026-01-01',
            });
        });

        test('returns an empty list when stored JSON is invalid', () => {
            localStorage.setItem('expenses', '{not-json');
            const tracker = makeTracker();
            expect(tracker.getAllExpenses()).toEqual([]);
        });
    });

    describe('addExpense', () => {
        test('appends a new expense and returns it', () => {
            const tracker = makeTracker();
            const created = tracker.addExpense(sampleExpense());

            expect(created).toBeInstanceOf(Expense);
            expect(tracker.getAllExpenses()).toHaveLength(1);
            expect(tracker.getAllExpenses()[0]).toBe(created);
        });

        test('parses amount as a float', () => {
            const tracker = makeTracker();
            const created = tracker.addExpense(sampleExpense({ amount: '19.99' }));
            expect(created.amount).toBeCloseTo(19.99);
            expect(typeof created.amount).toBe('number');
        });

        test('trims description and category', () => {
            const tracker = makeTracker();
            const created = tracker.addExpense(sampleExpense());
            expect(created.description).toBe('Coffee');
            expect(created.category).toBe('Food');
        });

        test('keeps the provided date', () => {
            const tracker = makeTracker();
            const created = tracker.addExpense(sampleExpense({ date: '2026-03-15' }));
            expect(created.date).toBe('2026-03-15');
        });

        test('assigns a generated id', () => {
            const tracker = makeTracker();
            const created = tracker.addExpense(sampleExpense());
            expect(created.id).toEqual(expect.any(String));
            expect(created.id.length).toBeGreaterThan(0);
        });

        test('persists the list to localStorage', () => {
            const tracker = makeTracker();
            const created = tracker.addExpense(sampleExpense({ amount: 5, description: 'Snack', category: 'Food' }));

            expect(localStorage.setItem).toHaveBeenCalled();
            const saved = JSON.parse(localStorage.getItem('expenses'));
            expect(saved).toEqual([
                {
                    id: created.id,
                    amount: 5,
                    description: 'Snack',
                    category: 'Food',
                    date: '2026-09-12',
                },
            ]);
        });

        test('can add multiple expenses', () => {
            const tracker = makeTracker();
            tracker.addExpense(sampleExpense({ description: 'A', category: 'Food' }));
            tracker.addExpense(sampleExpense({ description: 'B', category: 'Travel' }));
            expect(tracker.getAllExpenses()).toHaveLength(2);
        });
    });

    describe('deleteExpense', () => {
        test('removes the expense with the matching id', () => {
            const tracker = makeTracker();
            const keep = tracker.addExpense(sampleExpense({ description: 'Keep', category: 'Food' }));
            const remove = tracker.addExpense(sampleExpense({ description: 'Remove', category: 'Food' }));

            tracker.deleteExpense(remove.id);

            const remaining = tracker.getAllExpenses();
            expect(remaining).toHaveLength(1);
            expect(remaining[0].id).toBe(keep.id);
            expect(remaining[0].description).toBe('Keep');
        });

        test('does nothing when the id is missing', () => {
            const tracker = makeTracker();
            const existing = tracker.addExpense(sampleExpense());

            tracker.deleteExpense('does-not-exist');

            expect(tracker.getAllExpenses()).toHaveLength(1);
            expect(tracker.getAllExpenses()[0].id).toBe(existing.id);
        });

        test('leaves an empty list when the last item is deleted', () => {
            const tracker = makeTracker();
            const only = tracker.addExpense(sampleExpense());
            tracker.deleteExpense(only.id);
            expect(tracker.getAllExpenses()).toEqual([]);
        });

        test('persists after deletion', () => {
            const tracker = makeTracker();
            const first = tracker.addExpense(sampleExpense({ description: 'First', category: 'Food' }));
            const second = tracker.addExpense(sampleExpense({ description: 'Second', category: 'Bills' }));

            tracker.deleteExpense(first.id);

            const saved = JSON.parse(localStorage.getItem('expenses'));
            expect(saved).toHaveLength(1);
            expect(saved[0].id).toBe(second.id);
        });
    });

    describe('filterByCategory', () => {
        let tracker;
        let food;
        let travel;

        beforeEach(() => {
            tracker = makeTracker();
            food = tracker.addExpense(sampleExpense({ description: 'Lunch', category: 'Food' }));
            travel = tracker.addExpense(sampleExpense({ description: 'Taxi', category: 'Travel' }));
            tracker.addExpense(sampleExpense({ description: 'Dinner', category: 'food' }));
        });

        test('returns a copy of every expense when category is "all"', () => {
            const result = tracker.filterByCategory('all');
            expect(result).toHaveLength(3);
            expect(result).not.toBe(tracker.expenses);
        });

        test('treats "ALL" as all expenses', () => {
            expect(tracker.filterByCategory('ALL')).toHaveLength(3);
        });

        test('returns all expenses when category is empty or nullish', () => {
            expect(tracker.filterByCategory('')).toHaveLength(3);
            expect(tracker.filterByCategory(null)).toHaveLength(3);
            expect(tracker.filterByCategory(undefined)).toHaveLength(3);
        });

        test('matches category case-insensitively', () => {
            const result = tracker.filterByCategory('FOOD');
            expect(result).toHaveLength(2);
            expect(result.map((e) => e.description).sort()).toEqual(['Dinner', 'Lunch']);
        });

        test('returns only expenses in the requested category', () => {
            const result = tracker.filterByCategory('Travel');
            expect(result).toEqual([travel]);
            expect(result[0].id).toBe(travel.id);
        });

        test('returns an empty array when no category matches', () => {
            expect(tracker.filterByCategory('Utilities')).toEqual([]);
        });

        test('does not remove items from the underlying list', () => {
            tracker.filterByCategory('Travel');
            expect(tracker.getAllExpenses()).toHaveLength(3);
            expect(tracker.getAllExpenses().some((e) => e.id === food.id)).toBe(true);
        });
    });

    describe('getAllExpenses', () => {
        test('returns a shallow copy so callers cannot mutate internal state by pushing', () => {
            const tracker = makeTracker();
            tracker.addExpense(sampleExpense());
            const copy = tracker.getAllExpenses();
            copy.push({ id: 'injected' });
            expect(tracker.getAllExpenses()).toHaveLength(1);
        });
    });

    describe('computeTotal', () => {
        test('sums amounts in the given list', () => {
            expect(
                ExpenseTracker.computeTotal([
                    { amount: 10 },
                    { amount: 2.5 },
                    { amount: 0.25 },
                ])
            ).toBeCloseTo(12.75);
        });

        test('returns 0 for an empty list', () => {
            expect(ExpenseTracker.computeTotal([])).toBe(0);
        });
    });

    describe('getUniqueCategories', () => {
        test('returns a Set of distinct category labels', () => {
            const tracker = makeTracker();
            tracker.addExpense(sampleExpense({ category: 'Food' }));
            tracker.addExpense(sampleExpense({ category: 'Food' }));
            tracker.addExpense(sampleExpense({ category: 'Travel' }));
            expect(tracker.getUniqueCategories()).toEqual(new Set(['Food', 'Travel']));
        });
    });
});
