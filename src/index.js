// 抑制 React Native Web 相关警告
const originalConsoleError = console.error;
console.error = (...args) => {
  // 忽略所有React Native特有的事件处理程序警告
  if (
    typeof args[0] === 'string' && 
    (
      args[0].includes('Unknown event handler property') ||
      args[0].includes('onStartShouldSetResponder') ||
      args[0].includes('onMoveShouldSetResponder') ||
      args[0].includes('onResponderGrant') ||
      args[0].includes('onResponderMove') ||
      args[0].includes('onResponderRelease') ||
      args[0].includes('onResponderTerminate') ||
      args[0].includes('onResponderTerminationRequest') ||
      args[0].includes('onPress') ||
      args[0].includes('onLongPress') ||
      args[0].includes('onPressIn') ||
      args[0].includes('onPressOut')
    )
  ) {
    // 完全忽略这些警告
    return;
  }
  originalConsoleError(...args);
};

// 为了更彻底地解决问题，我们还可以修改React Native Web的警告设置
if (typeof window !== 'undefined' && window.document) {
  // 我们在Web环境中
  // 这里可以添加其他Web特定的初始化代码
} 