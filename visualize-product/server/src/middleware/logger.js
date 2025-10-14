import dayjs from 'dayjs';

const colorMap = {
  GET: '\x1b[32m',
  POST: '\x1b[33m',
  PUT: '\x1b[36m',
  PATCH: '\x1b[35m',
  DELETE: '\x1b[31m',
  reset: '\x1b[0m',
};

const statusColorMap = {
  success: '\x1b[32m',
  redirect: '\x1b[36m',
  clientError: '\x1b[33m',
  serverError: '\x1b[31m',
  reset: '\x1b[0m',
};

const getStatusColor = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) return statusColorMap.success;
  if (statusCode >= 300 && statusCode < 400) return statusColorMap.redirect;
  if (statusCode >= 400 && statusCode < 500) return statusColorMap.clientError;
  if (statusCode >= 500) return statusColorMap.serverError;
  return statusColorMap.reset;
};

const getStatusEmoji = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) return '✅';
  if (statusCode >= 300 && statusCode < 400) return '🔄';
  if (statusCode >= 400 && statusCode < 500) return '⚠️';
  if (statusCode >= 500) return '💥';
  return '❓';
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const maskSensitiveData = (data) => {
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'creditCard'];
  const masked = { ...data };
  
  Object.keys(masked).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      masked[key] = '***MASKED***';
    }
  });
  
  return masked;
};

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const methodColor = colorMap[req.method] || colorMap.reset;
    const statusColor = getStatusColor(res.statusCode);
    const statusEmoji = getStatusEmoji(res.statusCode);
    
    const logLine = [
      `${methodColor}${req.method}${colorMap.reset}`,
      `${statusColor}${res.statusCode}${colorMap.reset}`,
      `${statusEmoji}`,
      `${req.originalUrl}`,
      `${duration}ms`,
      req.ip || req.connection.remoteAddress,
    ].join(' | ');
    
    console.log(`[${timestamp}] ${logLine}`);
    
    if (process.env.NODE_ENV === 'development' && req.body && Object.keys(req.body).length > 0) {
      const maskedBody = maskSensitiveData(req.body);
      console.log('   📦 Body:', JSON.stringify(maskedBody, null, 2));
    }
    
    if (res.statusCode >= 400) {
      console.log(`   ❌ Error URL: ${req.originalUrl}`);
      console.log(`   📍 User Agent: ${req.get('user-agent') || 'Unknown'}`);
    }
  });
  
  next();
};

export const performanceLogger = (req, res, next) => {
  const startMemory = process.memoryUsage().heapUsed;
  const startCPU = process.cpuUsage();
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage().heapUsed;
    const endCPU = process.cpuUsage(startCPU);
    
    const duration = Number(endTime - startTime) / 1e6;
    const memoryUsed = endMemory - startMemory;
    const cpuUser = endCPU.user / 1000;
    const cpuSystem = endCPU.system / 1000;
    
    if (duration > 1000 || Math.abs(memoryUsed) > 10 * 1024 * 1024) {
      console.log('\n⚠️  Performance Warning:');
      console.log(`   🕐 Duration: ${duration.toFixed(2)}ms`);
      console.log(`   💾 Memory: ${formatBytes(Math.abs(memoryUsed))}`);
      console.log(`   🖥️  CPU User: ${cpuUser.toFixed(2)}ms`);
      console.log(`   🖥️  CPU System: ${cpuSystem.toFixed(2)}ms`);
      console.log(`   📍 Route: ${req.method} ${req.originalUrl}\n`);
    }
  });
  
  next();
};

export const queryLogger = (req, res, next) => {
  if (Object.keys(req.query).length > 0) {
    console.log('   🔍 Query Params:', req.query);
  }
  next();
};

export const responseTimeLogger = () => {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      res.setHeader('X-Response-Time', `${duration}ms`);
    });
    
    next();
  };
};

export const apiUsageTracker = () => {
  const usageStats = new Map();
  
  return (req, res, next) => {
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    const current = usageStats.get(endpoint) || { count: 0, totalTime: 0 };
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      current.count += 1;
      current.totalTime += duration;
      current.avgTime = (current.totalTime / current.count).toFixed(2);
      usageStats.set(endpoint, current);
    });
    
    next();
  };
};

export const securityLogger = (req, res, next) => {
  const suspiciousPatterns = [
    /(\$where|\$regex|\$ne)/i,
    /(union|select|insert|update|delete|drop)/i,
    /(<script|javascript:|onerror=)/i,
    /(\.\.\/|\.\.\\)/,
  ];
  
  const checkString = JSON.stringify(req.body) + JSON.stringify(req.query);
  
  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(checkString)) {
      console.warn('\n🚨 Security Alert:');
      console.warn(`   Pattern Detected: ${pattern}`);
      console.warn(`   IP: ${req.ip}`);
      console.warn(`   URL: ${req.originalUrl}`);
      console.warn(`   Method: ${req.method}`);
      console.warn(`   Timestamp: ${new Date().toISOString()}\n`);
    }
  });
  
  next();
};

export const errorLogger = (err, req, res, next) => {
  console.error('\n💥 Error Occurred:');
  console.error(`   Message: ${err.message}`);
  console.error(`   Status: ${err.statusCode || 500}`);
  console.error(`   URL: ${req.originalUrl}`);
  console.error(`   Method: ${req.method}`);
  console.error(`   IP: ${req.ip}`);
  console.error(`   Timestamp: ${new Date().toISOString()}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.error(`   Stack: ${err.stack}\n`);
  }
  
  next(err);
};

export default {
  requestLogger,
  performanceLogger,
  queryLogger,
  responseTimeLogger,
  apiUsageTracker,
  securityLogger,
  errorLogger,
};
