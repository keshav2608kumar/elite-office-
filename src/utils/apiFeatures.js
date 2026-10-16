class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Prevent any NoSQL injection by ensuring queryObj has no keys with $
    const sanitizeObj = (obj) => {
      for (let key in obj) {
        if (key.startsWith('$')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObj(obj[key]);
        }
      }
    };
    sanitizeObj(queryObj);

    // Advanced filtering for specific fields could go here if requested, 
    // but instructed: "NEVER allow $ operators from query string."
    // So we just use exact matches
    this.query = this.query.find(queryObj);

    return this;
  }

  search() {
    if (this.queryString.search) {
      // Assuming text index exists, but regex works as fallback for simple string matching
      // The requirement says "text search using $text or regex on name field"
      this.query = this.query.find({
        $or: [
          { $text: { $search: this.queryString.search } }
        ]
      });
      // Alternatively, using regex on name if text search isn't configured globally:
      // this.query = this.query.find({ name: { $regex: this.queryString.search, $options: 'i' } });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 12;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    
    // Storing pagination meta for the caller
    this.pagination = { page, limit };

    return this;
  }
}

module.exports = ApiFeatures;
