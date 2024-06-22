

module.exports = function toMermaid(stateMachine) {
  return JSON.stringify(stateMachine, null, 2);
}
