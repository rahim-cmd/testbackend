const test = require('node:test');
const assert = require('node:assert/strict');
const { circleCreateValidation, circleUpdateValidation } = require('../src/validators/circleValidator');

const runValidation = async (validationChain, body) => {
  const req = { body };
  const res = {};
  const next = () => {};

  const middleware = validationChain[0];
  await middleware(req, res, next);
  return req;
};

test('create validation rejects missing required fields', async () => {
  const req = await runValidation(circleCreateValidation, {
    title: '',
    meeting_date: '2026-07-20',
    start_time: '10:00',
    end_time: '11:00',
    max_members: 10,
  });

  assert.ok(req.body.title === '');
});

test('update validation allows partial updates', async () => {
  const req = await runValidation(circleUpdateValidation, {
    title: 'Updated Circle',
  });

  assert.equal(req.body.title, 'Updated Circle');
});
