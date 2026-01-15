import React, { useState } from 'react';
import {
  Box,
  CardMedia,
  IconButton,
  Dialog,
  DialogContent,
  Typography,
} from '@mui/material';
import {
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';

const ProductImage = ({ images, alt, height = 200, sx = {} }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          height,
          backgroundColor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No image available
        </Typography>
      </Box>
    );
  }

  const currentImage = images[currentImageIndex];
  const hasMultipleImages = images.length > 1;

  const handlePreviousImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const handleImageClick = () => {
    setIsZoomOpen(true);
  };

  const handleCloseZoom = () => {
    setIsZoomOpen(false);
  };

  return (
    <>
      <Box sx={{ position: 'relative', ...sx }}>
        <CardMedia
          component="img"
          height={height}
          image={currentImage.url}
          alt={alt}
          sx={{
            objectFit: 'cover',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.02)',
            },
          }}
          onClick={handleImageClick}
          onError={(e) => {
            e.target.src = '/placeholder-product.jpg';
          }}
        />

        {hasMultipleImages && (
          <>
            <IconButton
              size="small"
              onClick={handlePreviousImage}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              <ChevronLeft />
            </IconButton>

            <IconButton
              size="small"
              onClick={handleNextImage}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              <ChevronRight />
            </IconButton>

            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1,
              }}
            >
              {images.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: index === currentImageIndex 
                      ? 'primary.main' 
                      : 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                />
              ))}
            </Box>
          </>
        )}

        <IconButton
          size="small"
          onClick={handleImageClick}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
            opacity: 0.8,
          }}
        >
          <ZoomIn />
        </IconButton>
      </Box>

      <Dialog
        open={isZoomOpen}
        onClose={handleCloseZoom}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 2, textAlign: 'center' }}>
          <img
            src={currentImage.url}
            alt={alt}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
            }}
            onError={(e) => {
              e.target.src = '/placeholder-product.jpg';
            }}
          />
          {hasMultipleImages && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center' }}>
              {images.map((image, index) => (
                <Box
                  key={index}
                  component="img"
                  src={image.url}
                  alt={`${alt} ${index + 1}`}
                  sx={{
                    width: 60,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: index === currentImageIndex 
                      ? '2px solid' 
                      : '2px solid transparent',
                    borderColor: 'primary.main',
                    opacity: index === currentImageIndex ? 1 : 0.6,
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      opacity: 1,
                    },
                  }}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductImage;
