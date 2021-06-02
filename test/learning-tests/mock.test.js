const forEach = ((items, callback) => {
    for (let i = 0; i < items.length; i++) {
      callback(items[i]);
    }
});
const mockCallback = jest.fn(x => x + 40);


test('Mock tests', () => {
    let array = [0, 1];
    forEach(array, mockCallback);

    // The mock function is called twice
    expect(mockCallback.mock.calls.length).toBe(2);

    // The first argument of the first call to the function was 0
    expect(mockCallback.mock.calls[0][0]).toBe(0);

    // The first argument of the second call to the function was 1
    expect(mockCallback.mock.calls[1][0]).toBe(1);

    // The return value of the first call to the function was 40
    expect(mockCallback.mock.results[0].value).toBe(40);
});

test('.mock Property', () => {
  const someMockFunction = jest.fn();

  const a = new someMockFunction();
  const b = {};
  const bound = someMockFunction.bind(b);
  bound();
  
  // The function was called exactly twice
  expect(someMockFunction.mock.calls.length).toBe(2);

  // The first arg of the first call to the function was 'first arg'
  expect(someMockFunction.mock.calls[0][0]).toBeUndefined();

  // The second arg of the first call to the function was 'second arg'
  expect(someMockFunction.mock.calls[0][1]).toBeUndefined();

  // The return value of the first call to the function was 'return value'
  expect(someMockFunction.mock.results[0].value).toBeUndefined();

  // This function was instantiated exactly twice
  expect(someMockFunction.mock.instances.length).toBe(2);

  // The object returned by the first instantiation of this function
  // had a `name` property whose value was set to 'test'
  expect(someMockFunction.mock.instances[0].name).toBeUndefined();

});

test('Injecting mock return values', () => {
  const myMock = jest.fn();
  expect(myMock()).toBeUndefined();
  // > undefined

  myMock.mockReturnValueOnce(10).mockReturnValueOnce('x').mockReturnValue(true);

  expect(myMock()).toBe(10);
  expect(myMock()).toBe('x');
  expect(myMock()).toBeTruthy();
  expect(myMock()).toBeTruthy();
});