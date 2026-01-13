import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  IconButton,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { productsAPI } from '../../services/api';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  // Debounced search suggestions
  const { data: suggestionsData } = useQuery(
    ['searchSuggestions', query],
    () => productsAPI.getSearchSuggestions(query),
    {
      enabled: query.length >= 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        setSuggestions(data.data.suggestions || []);
      },
    }
  );

  const handleSearch = (searchQuery) => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  return (
    <Box sx={{ width: 300, mr: 2 }}>
      <form onSubmit={handleSubmit}>
        <Autocomplete
          freeSolo
          options={suggestions.map((suggestion) => suggestion.text)}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              size="small"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="submit"
                      size="small"
                      onClick={() => handleSearch(query)}
                    >
                      <Search />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          )}
          onInputChange={(event, value) => setQuery(value)}
          onChange={(event, value) => {
            if (typeof value === 'string') {
              handleSearch(value);
            } else if (value && value.text) {
              handleSearch(value.text);
            }
          }}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              {option}
            </Box>
          )}
          noOptionsText="No suggestions"
          filterOptions={(options, state) => options}
        />
      </form>
    </Box>
  );
};

export default SearchBar;
